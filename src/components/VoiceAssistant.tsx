'use client';

import {
	useState,
	useEffect,
	useRef,
	useImperativeHandle,
	forwardRef,
} from 'react';
import {
	Box,
	Card,
	Typography,
	Button,
	TextField,
	Paper,
	Stack,
	IconButton,
	Slider,
	Collapse,
	Chip,
	Grow,
	alpha,
	Switch,
	FormControlLabel,
	Select,
	MenuItem,
	FormControl,
} from '@mui/material';
import {
	Mic,
	MicOff,
	Psychology,
	VolumeUp,
	VolumeOff,
	PlayArrow,
	Pause,
	Stop,
	Settings,
	Edit,
	Send,
	Cancel,
	ExpandMore,
	ExpandLess,
	RecordVoiceOver,
	VoiceChat,
} from '@mui/icons-material';

import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceOutput } from '@/hooks/useVoiceOutput';
import { AnalysisProgress } from './AnalysisProgress';
import { AnalysisResults } from './AnalysisResults';

interface VoiceAssistantRef {
	startVoiceInput: () => void;
}

export const VoiceAssistant = forwardRef<VoiceAssistantRef>((_, ref) => {
	// State management
	const [mounted, setMounted] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [lastResponse, setLastResponse] = useState<string>('');
	const [analysisData, setAnalysisData] = useState<any>(null);
	const [queryHistory, setQueryHistory] = useState<string[]>([]);
	const [abortController, setAbortController] =
		useState<AbortController | null>(null);
	const [showAudioControls, setShowAudioControls] = useState(false);
	const [autoSpeak, setAutoSpeak] = useState(true);

	// Edit functionality state
	const [isEditing, setIsEditing] = useState(false);
	const [editedQuery, setEditedQuery] = useState('');

	// Voice hooks
	const {
		transcript,
		isListening,
		isMicrophoneAvailable,
		startListening,
		stopListening,
		resetTranscript,
		error: voiceError,
	} = useVoiceRecognition();

	const {
		isSpeaking,
		speak,
		pause,
		resume,
		stop: stopSpeaking,
		isPaused,
		setRate,
		setVolume,
		setVoice,
		currentRate,
		currentVolume,
		currentVoice,
		availableVoices,
		error: speechError,
	} = useVoiceOutput();

	// Refs
	const lastTranscriptRef = useRef<string>('');
	const silenceTimer = useRef<NodeJS.Timeout | null>(null);

	// Fix hydration error
	useEffect(() => {
		setMounted(true);
	}, []);

	// Expose voice input method to parent components (React 19 style)
	useImperativeHandle(ref, () => ({
		startVoiceInput: handleVoiceInput,
	}));

	// Auto-submit after 4 seconds of silence - ONLY if not editing
	useEffect(() => {
		if (transcript && transcript !== lastTranscriptRef.current && !isEditing) {
			lastTranscriptRef.current = transcript;

			// Clear existing timer
			if (silenceTimer.current) {
				clearTimeout(silenceTimer.current);
			}

			// IMMEDIATELY set edited query when transcript appears
			setEditedQuery(transcript);

			// Set new timer for auto-submit (only if not editing)
			const timer = setTimeout(() => {
				if (transcript.trim() && isListening && !isEditing) {
					console.log('Auto-submitting after silence:', transcript);
					stopListening();
					processQuery(transcript);
				}
			}, 4000);

			silenceTimer.current = timer;
		}

		return () => {
			if (silenceTimer.current) {
				clearTimeout(silenceTimer.current);
			}
		};
	}, [transcript, isListening, isEditing]);

	// Keyboard shortcuts
	useEffect(() => {
		if (!mounted) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			// Space bar to toggle voice input (when not editing)
			if (
				event.code === 'Space' &&
				!isEditing &&
				event.target === document.body
			) {
				event.preventDefault();
				handleVoiceInput();
			}

			// Escape to cancel/stop everything
			if (event.code === 'Escape') {
				if (isListening) {
					stopListening();
					resetTranscript();
					setEditedQuery('');
				} else if (isSpeaking) {
					stopSpeaking();
				} else if (isProcessing) {
					handleStopQuery();
				} else if (isEditing) {
					handleCancelEdit();
				}
			}

			// Enter to submit (when editing)
			if (event.code === 'Enter' && isEditing) {
				event.preventDefault();
				handleSubmitEditedQuery();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [mounted, isListening, isSpeaking, isEditing, isProcessing]);

	// Load settings from localStorage
	useEffect(() => {
		if (!mounted) return;

		try {
			const saved = localStorage.getItem('voiceAssistantHistory');
			if (saved) {
				setQueryHistory(JSON.parse(saved));
			}

			const savedAutoSpeak = localStorage.getItem('voiceAssistantAutoSpeak');
			if (savedAutoSpeak !== null) {
				setAutoSpeak(JSON.parse(savedAutoSpeak));
			}
		} catch (error) {
			console.error('Failed to load settings:', error);
		}
	}, [mounted]);

	// Save query history to localStorage
	const saveQueryHistory = (newHistory: string[]) => {
		try {
			setQueryHistory(newHistory);
			localStorage.setItem('voiceAssistantHistory', JSON.stringify(newHistory));
		} catch (error) {
			console.error('Failed to save query history:', error);
		}
	};

	// Save auto-speak setting
	const handleAutoSpeakChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const newValue = event.target.checked;
		setAutoSpeak(newValue);
		try {
			localStorage.setItem('voiceAssistantAutoSpeak', JSON.stringify(newValue));
		} catch (error) {
			console.error('Failed to save auto-speak setting:', error);
		}
	};

	const handleVoiceInput = () => {
		if (!mounted) return;

		if (isListening) {
			stopListening();
		} else {
			resetTranscript();
			setIsEditing(false);
			setEditedQuery('');
			startListening();
		}
	};

	const handleStopQuery = () => {
		// Stop any pending auto-submit
		if (silenceTimer.current) {
			clearTimeout(silenceTimer.current);
			silenceTimer.current = null;
		}

		// Stop any in-progress API call
		if (abortController) {
			abortController.abort();
			setAbortController(null);
		}

		setIsProcessing(false);
	};

	// Edit functionality handlers
	const handleStartEdit = () => {
		console.log(
			'🛑 Starting edit mode - stopping auto-submit and any processing'
		);

		// IMMEDIATELY stop auto-submit timer
		if (silenceTimer.current) {
			clearTimeout(silenceTimer.current);
			silenceTimer.current = null;
		}

		// STOP any in-progress query processing
		if (abortController) {
			abortController.abort();
			setAbortController(null);
		}
		setIsProcessing(false);

		// Stop listening if currently listening
		if (isListening) {
			stopListening();
		}

		// Enter edit mode
		setIsEditing(true);
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
		setEditedQuery(transcript || ''); // Reset to original transcript
	};

	const handleSubmitEditedQuery = () => {
		if (editedQuery.trim()) {
			console.log('🚀 Submitting EDITED query:', editedQuery);
			setIsEditing(false);
			processQuery(editedQuery.trim()); // Submit the EDITED query, not transcript
		}
	};

	const processQuery = async (query: string) => {
		console.log('📝 Processing query:', query);
		setIsProcessing(true);
		setAnalysisData(null);

		// Save to history
		const newHistory = [query, ...queryHistory.slice(0, 9)];
		saveQueryHistory(newHistory);

		try {
			const controller = new AbortController();
			setAbortController(controller);

			const response = await fetch('/api/analyze', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query }),
				signal: controller.signal,
			});

			if (!response.ok) {
				throw new Error(`Analysis failed: ${response.status}`);
			}

			const data = await response.json();
			console.log('📊 API Response:', data);

			if (data.success) {
				setAnalysisData(data);
				setLastResponse(data.spokenResponse);

				// Auto-speak the response if enabled
				if (autoSpeak && data.spokenResponse) {
					console.log('🔊 Auto-speaking response');
					try {
						await speak(data.spokenResponse);
					} catch (speechErr) {
						console.error('Speech error:', speechErr);
					}
				}
			} else {
				throw new Error(data.error || 'Analysis failed');
			}
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.log('Query was cancelled');
				return;
			}

			console.error('Error processing query:', error);
			const errorMessage =
				'I apologize, but I encountered an error processing your request. Please try again.';
			setLastResponse(errorMessage);

			if (autoSpeak) {
				try {
					await speak(errorMessage);
				} catch (speechErr) {
					console.error('Speech error:', speechErr);
				}
			}
		} finally {
			setIsProcessing(false);
			setAbortController(null);
		}
	};

	// Manual speak function for the "Speak Response" button
	const handleManualSpeak = () => {
		if (lastResponse && !isSpeaking) {
			speak(lastResponse);
		}
	};

	// Test voice function
	const handleTestVoice = () => {
		if (!isSpeaking) {
			speak(
				'Hello! This is a test of the selected voice. How does this sound?'
			);
		}
	};

	// Get voice display name
	const getVoiceDisplayName = (voice: SpeechSynthesisVoice) => {
		return `${voice.name} (${voice.lang})`;
	};

	// Prevent hydration mismatch by not rendering until mounted
	if (!mounted) {
		return (
			<Box sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 2, md: 3 } }}>
				<Card elevation={0} sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
					<Typography variant='h4'>Loading Voice Assistant...</Typography>
				</Card>
			</Box>
		);
	}

	return (
		<Box
			id='voice-assistant'
			sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 2, md: 3 } }}>
			{/* Main Control Panel */}
			<Card elevation={0} sx={{ mb: 4, p: { xs: 3, md: 5 } }}>
				<Box sx={{ textAlign: 'center', mb: 5 }}>
					<Typography
						variant='h3'
						component='h2'
						gutterBottom
						sx={{
							fontWeight: 700,
							color: 'text.primary',
							fontSize: { xs: '2rem', md: '2.5rem' },
						}}>
						AI Crypto Analysis
					</Typography>
					<Typography
						variant='body1'
						color='text.secondary'
						sx={{
							maxWidth: 600,
							mx: 'auto',
							fontSize: '1.1rem',
							lineHeight: 1.6,
						}}>
						Speak naturally or type your question to get instant analysis
					</Typography>
				</Box>

				{/* Voice Settings */}
				<Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
					<FormControlLabel
						control={
							<Switch
								checked={autoSpeak}
								onChange={handleAutoSpeakChange}
								color='primary'
							/>
						}
						label='Auto-speak responses'
						sx={{
							'& .MuiFormControlLabel-label': {
								fontSize: '0.9rem',
								color: 'text.secondary',
							},
						}}
					/>
				</Box>

				{/* Voice Input Section */}
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
					{/* Voice Button */}
					<Box sx={{ textAlign: 'center' }}>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 3,
							}}>
							<IconButton
								onClick={handleVoiceInput}
								disabled={
									(!isMicrophoneAvailable && !isListening) || isProcessing
								}
								sx={{
									width: { xs: 80, md: 100 },
									height: { xs: 80, md: 100 },
									background: isListening ? '#FF6B6B' : '#00C896',
									color: 'white',
									'&:hover': {
										background: isListening ? '#FF5252' : '#00B085',
										transform: 'scale(1.05)',
									},
									'&:disabled': {
										background: '#333',
										color: '#666',
									},
									transition: 'all 0.3s ease',
									boxShadow: isListening
										? '0 0 30px rgba(255, 107, 107, 0.4)'
										: '0 0 30px rgba(0, 200, 150, 0.4)',
								}}>
								{isListening ? (
									<MicOff sx={{ fontSize: { xs: 32, md: 40 } }} />
								) : (
									<Mic sx={{ fontSize: { xs: 32, md: 40 } }} />
								)}
							</IconButton>

							{/* Stop Processing Button */}
							{isProcessing && (
								<IconButton
									onClick={handleStopQuery}
									sx={{
										bgcolor: '#FF6B6B',
										color: 'white',
										'&:hover': { bgcolor: '#FF5252' },
									}}>
									<Stop />
								</IconButton>
							)}
						</Box>

						<Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
							{isListening
								? 'Listening... (Click to stop or wait for auto-submit)'
								: 'Click to start voice input'}
						</Typography>
					</Box>

					{/* Audio Controls - Always show when we have a response */}
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 2,
								flexWrap: 'wrap',
							}}>
							{/* Manual Speak Button */}
							{lastResponse && !isSpeaking && (
								<Button
									onClick={handleManualSpeak}
									startIcon={<RecordVoiceOver />}
									variant='contained'
									sx={{
										bgcolor: '#00C896',
										'&:hover': { bgcolor: '#00B085' },
									}}>
									Speak Response
								</Button>
							)}

							{/* Playback Controls */}
							{isSpeaking && (
								<Stack direction='row' spacing={1}>
									<IconButton
										onClick={isPaused ? resume : pause}
										sx={{
											bgcolor: 'primary.main',
											color: 'white',
											'&:hover': { bgcolor: 'primary.dark' },
										}}>
										{isPaused ? <PlayArrow /> : <Pause />}
									</IconButton>
									<IconButton
										onClick={stopSpeaking}
										sx={{
											bgcolor: '#FF6B6B',
											color: 'white',
											'&:hover': { bgcolor: '#FF5252' },
										}}>
										<Stop />
									</IconButton>
								</Stack>
							)}

							{/* Audio Settings Toggle */}
							<Button
								onClick={() => setShowAudioControls(!showAudioControls)}
								startIcon={<Settings />}
								endIcon={showAudioControls ? <ExpandLess /> : <ExpandMore />}
								variant='outlined'
								size='small'>
								Audio Settings
							</Button>
						</Box>

						{/* Voice Status */}
						{isSpeaking && (
							<Box sx={{ textAlign: 'center' }}>
								<Chip
									icon={<VolumeUp />}
									label={isPaused ? 'Paused' : 'Speaking...'}
									color='primary'
									sx={{ animation: isPaused ? 'none' : 'pulse 2s infinite' }}
								/>
							</Box>
						)}

						{/* Current Voice Display */}
						{currentVoice && (
							<Box sx={{ textAlign: 'center' }}>
								<Chip
									icon={<VoiceChat />}
									label={`Voice: ${currentVoice.name}`}
									variant='outlined'
									size='small'
								/>
							</Box>
						)}

						{/* Expanded Audio Controls */}
						<Collapse in={showAudioControls}>
							<Paper
								elevation={1}
								sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
								{/* Voice Selection */}
								<Box sx={{ mb: 3 }}>
									<Typography
										variant='body2'
										gutterBottom
										sx={{ color: 'text.secondary', fontWeight: 600 }}>
										Voice Selection
									</Typography>
									<Stack
										direction={{ xs: 'column', sm: 'row' }}
										spacing={2}
										alignItems={{ sm: 'center' }}>
										<FormControl fullWidth sx={{ minWidth: 200 }}>
											<Select
												value={currentVoice?.name || ''}
												onChange={(e) => {
													const selectedVoice = availableVoices.find(
														(v) => v.name === e.target.value
													);
													setVoice(selectedVoice || null);
												}}
												displayEmpty
												size='small'>
												<MenuItem value=''>
													<em>Default Voice</em>
												</MenuItem>
												{availableVoices
													.filter((v) => v.lang.includes('US'))
													.map((voice) => (
														<MenuItem key={voice.name} value={voice.name}>
															{getVoiceDisplayName(voice)}
														</MenuItem>
													))}
											</Select>
										</FormControl>
										<Button
											onClick={handleTestVoice}
											variant='outlined'
											size='small'
											startIcon={<VoiceChat />}
											disabled={isSpeaking}>
											Test Voice
										</Button>
									</Stack>
								</Box>

								{/* Speed Control */}
								<Box sx={{ mb: 3 }}>
									<Typography
										variant='body2'
										gutterBottom
										sx={{ color: 'text.secondary', fontWeight: 600 }}>
										Speech Speed: {currentRate}×
									</Typography>
									<Stack direction='row' spacing={1} flexWrap='wrap'>
										{[0.5, 0.75, 1, 1.25, 1.5, 2].map((option) => (
											<Button
												key={option}
												variant={
													currentRate === option ? 'contained' : 'outlined'
												}
												onClick={() => setRate(option)}
												size='small'
												sx={{ minWidth: '60px' }}>
												{option}×
											</Button>
										))}
									</Stack>
								</Box>

								{/* Volume Control */}
								<Box>
									<Typography
										variant='body2'
										gutterBottom
										sx={{ color: 'text.secondary', fontWeight: 600 }}>
										Volume: {Math.round(currentVolume * 100)}%
									</Typography>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
										<IconButton onClick={() => setVolume(0)} size='small'>
											<VolumeOff />
										</IconButton>
										<Slider
											value={currentVolume}
											onChange={(_, value) => setVolume(value as number)}
											min={0}
											max={1}
											step={0.1}
											sx={{
												flex: 1,
												'& .MuiSlider-thumb': {
													'&:hover': {
														boxShadow:
															'0px 0px 0px 8px rgba(63, 81, 181, 0.16)',
													},
												},
											}}
										/>
										<IconButton onClick={() => setVolume(1)} size='small'>
											<VolumeUp />
										</IconButton>
									</Box>
								</Box>
							</Paper>
						</Collapse>
					</Box>

					{/* Transcript Display with IMMEDIATE Edit Options */}
					<Grow in={!!(transcript || isEditing || editedQuery)}>
						<Box>
							{(transcript || isEditing || editedQuery) && (
								<Paper
									elevation={0}
									sx={{
										p: 3,
										borderRadius: 2,
										bgcolor: '#1A1A1A',
										border: '1px solid #2A2A2A',
									}}>
									{isEditing ? (
										<Box
											sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
											<Typography
												variant='body2'
												sx={{ color: 'text.secondary' }}>
												Edit your query:
											</Typography>
											<TextField
												fullWidth
												multiline
												rows={2}
												value={editedQuery}
												onChange={(e) => setEditedQuery(e.target.value)}
												placeholder='Type your cryptocurrency question...'
												variant='outlined'
												autoFocus
											/>
											<Box sx={{ display: 'flex', gap: 2 }}>
												<Button
													variant='contained'
													onClick={handleSubmitEditedQuery}
													startIcon={<Send />}
													sx={{ flex: 1 }}
													disabled={!editedQuery.trim()}>
													Analyze
												</Button>
												<Button
													variant='outlined'
													onClick={handleCancelEdit}
													startIcon={<Cancel />}>
													Cancel
												</Button>
											</Box>
										</Box>
									) : (
										<Box>
											<Typography
												variant='body2'
												sx={{ color: 'text.secondary', mb: 1 }}>
												{isListening ? 'Listening...' : 'Voice Input:'}
											</Typography>
											<Typography
												variant='body1'
												sx={{ mb: 2, fontStyle: 'italic' }}>
												"{editedQuery || transcript}"
											</Typography>

											{/* IMMEDIATE Edit and Submit Options - Show as soon as transcript appears */}
											{transcript && (
												<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
													<Button
														variant='outlined'
														onClick={handleStartEdit}
														startIcon={<Edit />}
														size='small'
														sx={{
															borderColor: '#FFB800',
															color: '#FFB800',
															'&:hover': {
																borderColor: '#FF9800',
																bgcolor: alpha('#FFB800', 0.1),
															},
														}}>
														Edit Query
													</Button>
													{!isListening && (
														<Button
															variant='contained'
															onClick={() => processQuery(transcript)}
															startIcon={<Psychology />}
															size='small'
															disabled={isProcessing}>
															Analyze As-Is
														</Button>
													)}
												</Box>
											)}

											{/* Auto-submit countdown - only show when listening */}
											{isListening && transcript && (
												<Typography
													variant='caption'
													sx={{
														color: 'warning.main',
														mt: 1,
														display: 'block',
													}}>
													Auto-submit in 4 seconds... (or click "Edit Query" to
													modify)
												</Typography>
											)}
										</Box>
									)}
								</Paper>
							)}
						</Box>
					</Grow>

					{/* Usage Instructions */}
					<Box sx={{ textAlign: 'center', mt: 2 }}>
						<Typography variant='body2' color='text.secondary'>
							💡 Try: "What's Bitcoin's sentiment?" • "Should I buy Ethereum?" •
							"How is Solana trending?"
						</Typography>
						<Typography
							variant='caption'
							color='text.secondary'
							sx={{ display: 'block', mt: 1 }}>
							Keyboard shortcuts: Space (voice), Esc (cancel), Enter (when
							editing)
						</Typography>
					</Box>
				</Box>
			</Card>

			{/* Enhanced Progress Loading */}
			<AnalysisProgress isAnalyzing={isProcessing} />

			{/* Enhanced Analysis Results */}
			{analysisData && <AnalysisResults data={analysisData} />}

			{/* Error Display */}
			{(voiceError || speechError) && (
				<Paper
					elevation={0}
					sx={{
						p: 2,
						bgcolor: 'error.light',
						color: 'error.contrastText',
						mt: 2,
					}}>
					<Typography variant='body2'>{voiceError || speechError}</Typography>
				</Paper>
			)}
		</Box>
	);
});

VoiceAssistant.displayName = 'VoiceAssistant';

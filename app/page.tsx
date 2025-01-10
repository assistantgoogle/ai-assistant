'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

const apps = {
  whatsapp: 'https://web.whatsapp.com',
  chrome: 'https://www.google.com',
  spotify: 'https://open.spotify.com',
  gmail: 'https://mail.google.com',
  youtube: 'https://www.youtube.com',
  maps: 'https://www.google.com/maps',
}

export default function PersonalAssistant() {
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'assistant' }[]>([
    { text: "Hello! I'm your personal assistant. I can help you open applications using voice commands or text. Try saying 'Hey Assistant' followed by your command!", sender: 'assistant' },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [status, setStatus] = useState('Click "Start Listening" to begin.')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const initializeVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser. Please use Chrome.')
      return
    }

    recognitionRef.current = new (window as any).webkitSpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = false
    recognitionRef.current.lang = 'en-US'

    recognitionRef.current.onstart = () => {
      console.log('Voice recognition started')
      setStatus('Listening for "Hey Assistant"...')
      setIsListening(true)
      setError(null)
    }

    recognitionRef.current.onresult = (event: any) => {
      const last = event.results.length - 1
      const transcript = event.results[last][0].transcript.toLowerCase()
      console.log('Heard:', transcript)

      if (transcript.includes('hey assistant')) {
        startListeningForCommand()
      } else if (isListening) {
        handleVoiceCommand(transcript)
      }
    }

    recognitionRef.current.onend = () => {
      console.log('Voice recognition ended')
      setIsListening(false)
      setStatus('Click "Start Listening" to begin.')
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error('Recognition error:', event.error)
      if (event.error === 'not-allowed') {
        setError('Microphone access is blocked. Please allow microphone access and try again.')
        setStatus('Microphone access blocked. Click "Start Listening" to try again.')
      } else {
        setError(`Voice recognition error: ${event.error}`)
        setStatus('Voice recognition error. Click "Start Listening" to try again.')
      }
      setIsListening(false)
    }

    try {
      recognitionRef.current.start()
    } catch (error) {
      console.error('Error starting recognition:', error)
      setError('Failed to start voice recognition. Please try again.')
    }
  }

  const startListeningForCommand = () => {
    setStatus('Listening for command...')
    setTimeout(() => {
      if (isListening) {
        setStatus('Listening for "Hey Assistant"...')
      }
    }, 5000)
  }

  const handleVoiceCommand = (command: string) => {
    console.log('Processing command:', command)

    const commandWords = command.split(' ')
    const appToOpen = commandWords.find(word => word.toLowerCase() in apps)

    if (appToOpen && command.includes('open')) {
      console.log(`Detected command to open: ${appToOpen}`)
      openApp(appToOpen.toLowerCase())
      addMessage(`Opening ${appToOpen}...`, 'assistant')
      setStatus(`Opening ${appToOpen}...`)
      setTimeout(() => setStatus('Listening for "Hey Assistant"...'), 2000)
      return
    }

    processMessage(command)
  }

  const processMessage = async (message: string) => {
    const lowercaseMsg = message.toLowerCase()

    addMessage("Thinking...", 'assistant')

    try {
      for (const [app, url] of Object.entries(apps)) {
        if (lowercaseMsg.includes(app) && lowercaseMsg.includes('open')) {
          const response = openApp(app)
          if (response) {
            updateLastMessage(response)
            return
          }
        }
      }

      if (message.trim().length < 2) {
        updateLastMessage("Please ask me a proper question or give me a command.")
        return
      }

      updateLastMessage("I can help you open various applications. Try saying 'open' followed by an app name (e.g., 'open chrome'). Available apps are: WhatsApp, Chrome, Spotify, Gmail, YouTube, and Maps.")
    } catch (error) {
      console.error('Error processing message:', error)
      updateLastMessage("I encountered an error while processing your request. Please try again.")
    }
  }

  const openApp = (app: string) => {
    if (app in apps) {
      window.open(apps[app as keyof typeof apps], '_blank')
      return `Opening ${app.charAt(0).toUpperCase() + app.slice(1)}...`
    }
    return null
  }

  const addMessage = (text: string, sender: 'user' | 'assistant') => {
    setMessages(prevMessages => [...prevMessages, { text, sender }])
  }

  const updateLastMessage = (text: string) => {
    setMessages(prevMessages => {
      const newMessages = [...prevMessages]
      newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], text }
      return newMessages
    })
  }

  const sendMessage = async () => {
    if (inputValue.trim()) {
      addMessage(inputValue, 'user')
      setInputValue('')
      await processMessage(inputValue)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      sendMessage()
    }
  }

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      initializeVoiceRecognition()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Personal Desktop Assistant</CardTitle>
          <p className="text-center text-gray-500">How can I help you today?</p>
          <div id="voiceStatus" className="text-center text-sm bg-gray-100 rounded-full px-3 py-1 mt-2">
            {status}
          </div>
          <Button onClick={toggleListening} className="mt-2">
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Button>
          {error && (
            <Alert variant="destructive" className="mt-2">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-[300px] overflow-y-auto space-y-2 p-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg ${
                    message.sender === 'assistant' ? 'bg-blue-100 mr-8' : 'bg-gray-100 ml-8'
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(apps).map((app) => (
                <Button key={app} variant="outline" size="sm" onClick={() => openApp(app)}>
                  Open {app}
                </Button>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Type your message here..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


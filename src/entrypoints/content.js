import jsQR from 'jsqr'
import { onMessage, sendMessage } from 'webext-bridge/content-script'

export default defineContentScript({
    matches: ['<all_urls>'],
    runAt: 'document_end',

    main() {
        let qrImages = []
        let qrButtons = []
        let originalStyles = new Map()

        /**
         * Check if an element is in the viewport
         */
        function isInViewport(element) {
            const rect = element.getBoundingClientRect()
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            )
        }

        /**
         * Scan an image for QR codes using jsQR
         */
        async function scanImageForQR(img) {
            try {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                
                canvas.width = img.naturalWidth || img.width
                canvas.height = img.naturalHeight || img.height
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                })
                
                return code ? { found: true, image: img } : { found: false }
            } catch (error) {
                console.error('Error scanning image:', error)
                return { found: false }
            }
        }

        /**
         * Highlight a QR code image with CSS and add button overlay
         */
        function highlightQRImage(img) {
            // Store original styles
            originalStyles.set(img, {
                outline: img.style.outline || '',
                outlineOffset: img.style.outlineOffset || '',
                boxShadow: img.style.boxShadow || '',
                position: img.style.position || '',
                zIndex: img.style.zIndex || '',
                transition: img.style.transition || ''
            })
            
            // Apply highlight styles
            img.style.outline = '4px solid #00d1b2'
            img.style.outlineOffset = '2px'
            img.style.boxShadow = '0 0 20px rgba(0, 209, 178, 0.8)'
            img.style.position = 'relative'
            img.style.zIndex = '999998'
            img.style.transition = 'all 0.2s ease'
            
            // Create button overlay
            const rect = img.getBoundingClientRect()
            const button = document.createElement('button')
            
            button.textContent = 'Add to 2FAuth'
            button.style.position = 'fixed'
            button.style.top = (rect.top + rect.height / 2 - 20) + 'px'
            button.style.left = (rect.left + rect.width / 2 - 75) + 'px'
            button.style.width = '150px'
            button.style.height = '40px'
            button.style.backgroundColor = '#00d1b2'
            button.style.color = 'white'
            button.style.border = 'none'
            button.style.borderRadius = '4px'
            button.style.cursor = 'pointer'
            button.style.fontSize = '14px'
            button.style.fontWeight = 'bold'
            button.style.zIndex = '999999'
            button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)'
            button.style.transition = 'all 0.2s ease'
            
            // Add hover effect
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = '#00f0d0'
                button.style.transform = 'scale(1.05)'
            })
            
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = '#00d1b2'
                button.style.transform = 'scale(1)'
            })
            
            // Add click handler
            button.addEventListener('click', async (event) => {
                event.preventDefault()
                event.stopPropagation()
                await handleQRClick(img)
            })
            
            document.body.appendChild(button)
            qrButtons.push(button)
            
            // Store button reference
            img._qrButton = button
        }

        /**
         * Handle QR code click
         */
        async function handleQRClick(img) {
            try {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                
                // Calculate resize dimensions (max 500px)
                let width = img.naturalWidth || img.width
                let height = img.naturalHeight || img.height
                
                const maxDimension = 500
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = (height / width) * maxDimension
                        width = maxDimension
                    } else {
                        width = (width / height) * maxDimension
                        height = maxDimension
                    }
                }
                
                canvas.width = width
                canvas.height = height
                ctx.drawImage(img, 0, 0, width, height)
                
                // Convert to blob
                const blob = await new Promise((resolve) => 
                    canvas.toBlob(resolve, 'image/png')
                )
                
                // Convert blob to ArrayBuffer
                const imageBuffer = await blob.arrayBuffer()
                
                // Send to background
                await sendMessage('QR_IMAGE_SELECTED', {
                    imageBuffer: Array.from(new Uint8Array(imageBuffer)),
                    mimeType: blob.type
                }, 'background')
                
                // Cleanup
                cleanup()
            } catch (error) {
                console.error('Error processing QR image:', error)
                await sendMessage('QR_CAPTURE_ERROR', {
                    error: 'Failed to process QR image'
                }, 'background')
                cleanup()
            }
        }

        /**
         * Scan page for QR codes
         */
        async function scanPage() {
            // Find all images in viewport
            const images = Array.from(document.querySelectorAll('img'))
            const visibleImages = images.filter(img => isInViewport(img) && img.complete && img.naturalWidth > 0)
            
            let foundCount = 0
            
            // Scan each image
            for (const img of visibleImages) {
                const result = await scanImageForQR(img)
                if (result.found) {
                    highlightQRImage(img)
                    qrImages.push(img)
                    foundCount++
                }
            }
            
            // Notify if no QR codes found
            if (foundCount === 0) {
                await sendMessage('QR_SCAN_COMPLETE', {
                    found: false,
                    count: 0
                }, 'background')
                cleanup()
            } else {
                await sendMessage('QR_SCAN_COMPLETE', {
                    found: true,
                    count: foundCount
                }, 'background')
            }
        }

        /**
         * Cleanup styles and buttons
         */
        function cleanup() {
            // Remove buttons
            qrButtons.forEach(button => button.remove())
            qrButtons = []
            
            // Restore original styles
            qrImages.forEach(img => {
                const original = originalStyles.get(img)
                if (original) {
                    img.style.outline = original.outline
                    img.style.outlineOffset = original.outlineOffset
                    img.style.boxShadow = original.boxShadow
                    img.style.position = original.position
                    img.style.zIndex = original.zIndex
                    img.style.transition = original.transition
                }
                delete img._qrButton
            })
            
            qrImages = []
            originalStyles.clear()
        }

        /**
         * Listen for cleanup message
         */
        onMessage('CLEANUP_CONTENT_SCRIPT', () => {
            cleanup()
            return { success: true }
        })

        /**
         * Listen for start scan message
         */
        onMessage('START_QR_SCAN', () => {
            scanPage()
            return { success: true }
        })

        // Listen for popup disconnect to cleanup
        browser.runtime.onConnect.addListener((port) => {
            port.onDisconnect.addListener(() => {
                cleanup()
            })
        })
    }
})

import jsQR from 'jsqr'
import { onMessage, sendMessage } from 'webext-bridge/content-script'

export default defineContentScript({
    matches: ['<all_urls>'],
    runAt: 'document_end',

    main() {
        let qrImages = []
        let qrButtons = []
        let originalStyles = new Map()
        let overlay = null
        let cancelButton = null
        let scrollListener = null
        let scrollTimer = null
        let resizeListener = null
        let resizeTimer = null
        let keyListener = null
        let addButtonCaption = null
        let cancelButtonCaption = null

        /**
         * Check if an element is at least partially in the viewport and actually visible
         */
        function isInViewport(element) {
            const rect = element.getBoundingClientRect()
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth
            
            // Check if element is in viewport bounds
            const inViewport = (
                rect.bottom > 0 &&
                rect.top < viewportHeight &&
                rect.right > 0 &&
                rect.left < viewportWidth &&
                rect.width > 0 &&
                rect.height > 0
            )
            
            if (!inViewport) {
                return false
            }
            
            // Check if element is actually visible (CSS visibility)
            const style = window.getComputedStyle(element)
            const isVisible = (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                parseFloat(style.opacity) > 0
            )
            
            return isVisible
        }

        /**
         * Extract the QR code portion from a canvas based on jsQR location data
         */
        function extractQRCodePortion(sourceCanvas, code) {
            const qrCanvas = document.createElement('canvas')
            const qrCtx = qrCanvas.getContext('2d')
            
            const { topLeftCorner, topRightCorner, bottomLeftCorner } = code.location
            const width = topRightCorner.x - topLeftCorner.x
            const height = bottomLeftCorner.y - topLeftCorner.y
            
            qrCanvas.width = width
            qrCanvas.height = height
            
            qrCtx.drawImage(
                sourceCanvas,
                topLeftCorner.x, topLeftCorner.y, width, height,
                0, 0, width, height
            )
            
            return qrCanvas
        }

        /**
         * Core QR scanning logic: scan canvas imageData and extract QR code
         */
        function scanCanvasImageData(canvas, element) {
            const ctx = canvas.getContext('2d')
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            })
            
            if (code) {
                const qrCanvas = extractQRCodePortion(canvas, code)
                
                return { 
                    found: true, 
                    qrCanvas: qrCanvas,
                    originalElement: element,
                    location: code.location 
                }
            }
            
            return { found: false }
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
                
                try {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                } catch (error) {
                    console.warn('[CONTENT] Cross-origin image detected, using screenshot fallback:', img.src)
                    return scanElementViaScreenshot(img)
                }
                
                try {
                    return scanCanvasImageData(canvas, img)
                } catch (error) {
                    if (error.name === 'SecurityError') {
                        console.warn('[CONTENT] Tainted canvas detected, using screenshot fallback')
                        return scanElementViaScreenshot(img)
                    }
                    throw error
                }
            } catch (error) {
                console.error('[CONTENT] Error scanning image:', error)
                return { found: false }
            }
        }

        /**
         * Scan a canvas element for QR codes using jsQR
         */
        async function scanCanvasForQR(canvas) {
            try {
                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    return { found: false }
                }
                
                try {
                    return scanCanvasImageData(canvas, canvas)
                } catch (error) {
                    if (error.name === 'SecurityError') {
                        console.warn('[CONTENT] Tainted canvas detected, using screenshot fallback')
                        return scanElementViaScreenshot(canvas)
                    }
                    throw error
                }
            } catch (error) {
                console.error('[CONTENT] Error scanning canvas:', error)
                return { found: false }
            }
        }

        /**
         * Fallback: scan element by taking a screenshot of its viewport region
         */
        async function scanElementViaScreenshot(element) {
            try {
                const rect = element.getBoundingClientRect()
                
                // Temporarily hide all action buttons before screenshot
                const buttonsVisibility = qrButtons.map(btn => btn.style.display)
                qrButtons.forEach(btn => btn.style.display = 'none')
                
                try {
                    // Request screenshot from background script
                    const response = await sendMessage('CAPTURE_SCREENSHOT', {
                        rect: {
                            x: Math.round(rect.x),
                            y: Math.round(rect.y),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height)
                        }
                    }, 'background')
                    
                    if (!response.success) {
                        return { found: false }
                    }
                    
                    // Create image from screenshot data
                    const img = new Image()
                    await new Promise((resolve, reject) => {
                        img.onload = resolve
                        img.onerror = reject
                        img.src = response.dataUrl
                    })
                    
                    // Scan the screenshot
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')
                    canvas.width = img.width
                    canvas.height = img.height
                    
                    ctx.drawImage(img, 0, 0)
                    
                    return scanCanvasImageData(canvas, element)
                } finally {
                    // Restore button visibility
                    qrButtons.forEach((btn, index) => {
                        btn.style.display = buttonsVisibility[index]
                    })
                }
            } catch (error) {
                console.error('[CONTENT] Error in screenshot fallback:', error)
                return { found: false }
            }
        }

        /**
         * Highlight a QR code element (img or canvas) with CSS and add button overlay
         */
        function highlightQRImage(qrData) {
            const element = qrData.originalElement
            
            // Store original styles
            originalStyles.set(element, {
                outline: element.style.outline || '',
                outlineOffset: element.style.outlineOffset || '',
                boxShadow: element.style.boxShadow || '',
                position: element.style.position || '',
                zIndex: element.style.zIndex || '',
                transition: element.style.transition || ''
            })
            
            // Apply highlight styles
            element.style.outline = '4px solid #00d1b2'
            element.style.outlineOffset = '2px'
            element.style.boxShadow = '0 0 20px rgba(0, 209, 178, 0.8)'
            element.style.position = 'relative'
            element.style.zIndex = '2147483641'
            element.style.transition = 'all 0.2s ease'
            
            // Create button overlay
            const rect = element.getBoundingClientRect()
            const button = document.createElement('button')
            
            button.textContent = addButtonCaption
            // button.setAttribute('aria-img', element.tagName === 'IMG' ? element.src : 'canvas-element')
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
            button.style.zIndex = '2147483642'
            button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)'
            button.style.transition = 'all 0.2s ease'
            button.style.fontFamily = 'BlinkMacSystemFont,-apple-system,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,Helvetica,Arial,sans-serif' 

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
                await handleQRClick(qrData)
            })
            
            document.body.appendChild(button)
            qrButtons.push(button)
            
            // Store button reference and QR data
            element._qrButton = button
            element._qrData = qrData
        }

        /**
         * Handle QR code click
         */
        async function handleQRClick(qrData) {
            try {
                // Convert the extracted QR canvas to blob
                const blob = await new Promise((resolve) => {
                    qrData.qrCanvas.toBlob((b) => resolve(b))
                })
                
                // Convert blob to ArrayBuffer for message transfer
                const arrayBuffer = await blob.arrayBuffer()
                
                // Send serializable data to popup
                await sendMessage('QR_IMAGE_SELECTED', {
                    imageBuffer: Array.from(new Uint8Array(arrayBuffer)),
                    mimeType: blob.type
                }, 'background')
                
                // Cleanup
                cleanup()
            } catch (error) {
                console.error('[CONTENT] Error processing QR image:', error)
                cleanup()
            }
        }

        /**
         * Create overlay and cancel button
         */
        function createOverlayAndCancelButton() {
            // Create overlay
            overlay = document.createElement('div')
            overlay.style.position = 'fixed'
            overlay.style.top = '0'
            overlay.style.left = '0'
            overlay.style.width = '100%'
            overlay.style.height = '100%'
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
            overlay.style.zIndex = '2147483640'
            overlay.style.pointerEvents = 'none'

            document.body.appendChild(overlay)
            
            // Create cancel button
            cancelButton = document.createElement('button')
            cancelButton.textContent = cancelButtonCaption
            cancelButton.title = cancelButtonCaption
            cancelButton.style.position = 'fixed'
            cancelButton.style.bottom = '20px'
            cancelButton.style.right = '20px'
            cancelButton.style.padding = '12px 24px'
            cancelButton.style.backgroundColor = '#f14668'
            cancelButton.style.color = 'white'
            cancelButton.style.border = 'none'
            cancelButton.style.borderRadius = '4px'
            cancelButton.style.cursor = 'pointer'
            cancelButton.style.fontSize = '14px'
            cancelButton.style.fontWeight = 'bold'
            cancelButton.style.zIndex = '2147483647'
            cancelButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)'
            cancelButton.style.transition = 'all 0.2s ease'
            cancelButton.style.fontFamily = 'BlinkMacSystemFont,-apple-system,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,Helvetica,Arial,sans-serif' 

            // Add hover effect
            cancelButton.addEventListener('mouseenter', () => {
                cancelButton.style.backgroundColor = '#ff5876'
                cancelButton.style.transform = 'scale(1.05)'
            })
            
            cancelButton.addEventListener('mouseleave', () => {
                cancelButton.style.backgroundColor = '#f14668'
                cancelButton.style.transform = 'scale(1)'
            })
            
            // Add click handler
            cancelButton.addEventListener('click', (event) => {
                event.preventDefault()
                event.stopPropagation()
                cleanup()
            })
            
            document.body.appendChild(cancelButton)
            
            // Add scroll listener to re-scan when user scrolls
            scrollListener = () => {
                // Cleanup immediately when scroll starts
                cleanupQRHighlights()
                
                // Debounce re-scan to wait for scroll to finish
                if (scrollTimer) {
                    clearTimeout(scrollTimer)
                }
                
                scrollTimer = setTimeout(() => {
                    scanForQRCodes()
                }, 400)
            }
            
            window.addEventListener('scroll', scrollListener, true)
            
            // Add resize listener to re-scan when viewport is resized
            resizeListener = () => {
                // Cleanup immediately when resize starts
                cleanupQRHighlights()
                
                // Debounce re-scan to wait for resize to finish
                if (resizeTimer) {
                    clearTimeout(resizeTimer)
                }
                
                resizeTimer = setTimeout(() => {
                    scanForQRCodes()
                }, 400)
            }
            
            window.addEventListener('resize', resizeListener, true)
            
            // Add ESC key listener
            keyListener = (event) => {
                if (event.key === 'Escape') {
                    event.preventDefault()
                    event.stopPropagation()
                    cleanup()
                }
            }
            
            window.addEventListener('keydown', keyListener, true)
        }

        /**
         * Scan for QR codes in the page
         */
        async function scanForQRCodes() {
            
            // Find all images in viewport
            const images = Array.from(document.querySelectorAll('img'))
            const visibleImages = images.filter(img => 
                isInViewport(img) && 
                img.complete && 
                img.naturalWidth >= 128 && 
                img.naturalHeight >= 128
            )
            
            // Find all canvas elements in viewport
            const canvases = Array.from(document.querySelectorAll('canvas'))
            const visibleCanvases = canvases.filter(canvas => 
                isInViewport(canvas) && 
                canvas.width >= 128 && 
                canvas.height >= 128
            )
            
            let foundCount = 0

            
            
            // Scan each image
            for (const img of visibleImages) {
                const result = await scanImageForQR(img)
                if (result.found) {
                    if (overlay == null) {
                        createOverlayAndCancelButton()
                    }
                    highlightQRImage(result)
                    qrImages.push(result.originalElement)
                    foundCount++
                }
            }
            
            // Scan each canvas
            for (const canvas of visibleCanvases) {
                const result = await scanCanvasForQR(canvas)
                if (result.found) {
                    if (overlay == null) {
                        createOverlayAndCancelButton()
                    }
                    highlightQRImage(result)
                    qrImages.push(result.originalElement)
                    foundCount++
                }
            }

            if (foundCount == 0) {
                cleanup()
            }

            // Notify popup of scan results
            await sendMessage('QR_SCAN_COMPLETE', {
                found: foundCount > 0,
                count: foundCount
            }, 'popup')
        }

        /**
         * Initial scan page setup
         */
        async function scanPage(trad) {
            addButtonCaption = trad.addButtonCaption || 'Add to 2FAuth'
            cancelButtonCaption = trad.cancelButtonCaption || 'Cancel'
            
            await scanForQRCodes()
        }

        /**
         * Cleanup only QR highlights and buttons (keep overlay and cancel button)
         */
        function cleanupQRHighlights() {
            // Remove QR action buttons
            qrButtons.forEach(button => button.remove())
            qrButtons = []
            
            // Restore original styles
            qrImages.forEach(element => {
                const original = originalStyles.get(element)
                if (original) {
                    element.style.outline = original.outline
                    element.style.outlineOffset = original.outlineOffset
                    element.style.boxShadow = original.boxShadow
                    element.style.position = original.position
                    element.style.zIndex = original.zIndex
                    element.style.transition = original.transition
                }
                delete element._qrButton
            })
            
            qrImages = []
            originalStyles.clear()
        }

        /**
         * Cleanup styles and buttons
         */
        function cleanup() {
            // Remove scroll listener
            if (scrollListener) {
                window.removeEventListener('scroll', scrollListener, true)
                scrollListener = null
            }
            
            // Remove resize listener
            if (resizeListener) {
                window.removeEventListener('resize', resizeListener, true)
                resizeListener = null
            }
            
            // Remove key listener
            if (keyListener) {
                window.removeEventListener('keydown', keyListener, true)
                keyListener = null
            }
            
            // Clear scroll timer
            if (scrollTimer) {
                clearTimeout(scrollTimer)
                scrollTimer = null
            }
            
            // Clear resize timer
            if (resizeTimer) {
                clearTimeout(resizeTimer)
                resizeTimer = null
            }
            
            // Remove overlay
            if (overlay) {
                overlay.remove()
                overlay = null
            }
            
            // Remove cancel button
            if (cancelButton) {
                cancelButton.remove()
                cancelButton = null
            }
            
            // Remove buttons
            cleanupQRHighlights()
        }

        /**
         * Listen for start scan message
         */
        onMessage('START_QR_SCAN', ({ data }) => {
            scanPage(data)
            return { success: true }
        })

        /**
         * Listen for start scan message
         */
        onMessage('CLEANUP', () => {
            cleanup()
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

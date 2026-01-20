/**
 * User gesture tracking utility
 * Manages detection of user interactions for autoplay policy compliance
 */

/**
 * Sets up global event listeners to detect user gestures
 * @param {Object} gestureRef - Ref object to track gesture state
 * @returns {Function} Cleanup function to remove listeners
 */
export const setupGestureTracking = (gestureRef) => {
  const handleUserGesture = () => {
    gestureRef.current = true;
  };
  
  window.addEventListener('pointerdown', handleUserGesture, { once: true });
  window.addEventListener('keydown', handleUserGesture, { once: true });
  
  return () => {
    window.removeEventListener('pointerdown', handleUserGesture);
    window.removeEventListener('keydown', handleUserGesture);
  };
};

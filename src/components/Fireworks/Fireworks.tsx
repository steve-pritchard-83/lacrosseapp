import { useEffect } from 'react';
import useStore from '../../store';
import styles from './Fireworks.module.css';

const Fireworks = () => {
  const hideFireworks = useStore(state => state.hideFireworks);

  useEffect(() => {
    const timer = setTimeout(() => {
      hideFireworks();
    }, 3000); // Duration of the fireworks display
    return () => clearTimeout(timer);
  }, [hideFireworks]);

  return (
    <div className={styles.fireworksContainer}>
      {[...Array(20)].map((_, i) => (
        <div 
          key={i} 
          className={styles.firework}
          style={{
            left: `${Math.random() * 100}vw`,
            top: `${Math.random() * 100}vh`,
            animationDelay: `${Math.random()}s`,
          }}
        />
      ))}
    </div>
  );
};

export default Fireworks; 
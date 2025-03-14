import React, { useEffect, useState } from 'react';
import { Button, Carousel } from 'antd';
import styles from './LandingPage.module.css';
const initItems = [
  {
    key: '1',
    title: 'Single Stop to get updates on fitness',
    content:
      'Generate workout & diet plans based on user goals. It track calories, weight, and workouts.',
  },
  {
    key: '4',
    title: ' AI Analysis',
    content:
        'Use ML models to create personalized workout plans based on fitness level, generate diet plans based on user goals. Scan meal images to detect nutritional values',
  },
  {
    key: '2',
    title: 'Meal Tracking and Recipe Finder',
    content:
      'Allows user to log meals manually. The app gives the total calories, nutrition info consumed for the day',
  },
  {
    key: '3',
    title: ' Workout Logging',
    content:
      'The user logs in daily workouts by selecting type of exercise & the duration.',
  },
];

export const TopCards = () => {
  const [items, setItems] = useState(initItems);

  useEffect(() => {
    setItems(initItems);
  }, [items]);

  return (
      <div>
    <div id="hero" className={styles.topBlock}/>
      <Carousel className={styles.heroBlock} autoplay>
        {items.map(item => {
          return (
            <div key={item.key} className="container-fluid">
              <div className="content">
                <h3>{item.title}</h3>
                <p>{item.content}</p>
              </div>
            </div>
          );
        })}
      </Carousel>
      </div>
  );
};

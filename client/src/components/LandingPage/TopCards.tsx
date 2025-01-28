import React, { useEffect, useState } from 'react';
import { Button, Carousel } from 'antd';
import styles from './LandingPage.module.css';
const initItems = [
  {
    key: '1',
    title: 'Single Stop to get updates on fitness. ....',
    content:
      'Single Stop to get updates',
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
      'The user logs in daily workouts by selecting- type of exercise & the duration.',
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
                <div className="btnHolder">
                  <Button type="primary" size="large">
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </Carousel>
      </div>
  );
};

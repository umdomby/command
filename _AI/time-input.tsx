import React, { useState, useEffect } from 'react';

const TimeInput = ({ onTimeChange, id : id}) => {
    const [hours, setHours] = useState('00');
    const [minutes, setMinutes] = useState('00');
    const [seconds, setSeconds] = useState('00');
    const [milliseconds, setMilliseconds] = useState('000');

    // Function to format the time string
    const formatTime = () => {
        return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    };

    // Effect to call the onTimeChange callback whenever the time changes
    useEffect(() => {
        onTimeChange(formatTime(), id);
    }, [hours, minutes, seconds, milliseconds]); // Dependencies to trigger effect

    return (
        <div>
            <input
                type="number"
                value={hours}
                onChange={(e) => {
                    let value = e.target.value;
                    if (value.length > 2) {
                        value = value.slice(-2);
                    }
                    const numericValue = parseInt(value, 10);
                    if (isNaN(numericValue) || numericValue < 0 || numericValue > 23) {
                        value = '00';
                    }
                    setHours(value.padStart(2, '0'));
                }}
                min="0"
                max="23"
            />
            :
            <input
                type="number"
                value={minutes}
                onChange={(e) => {
                    let value = e.target.value;
                    if (value.length > 2) {
                        value = value.slice(-2);
                    }
                    const numericValue = parseInt(value, 10);
                    if (isNaN(numericValue) || numericValue < 0 || numericValue > 59) {
                        value = '00';
                    }
                    setMinutes(value.padStart(2, '0'));
                }}
                min="0"
                max="59"
            />
            :
            <input
                type="number"
                value={seconds}
                onChange={(e) => {
                    let value = e.target.value;
                    if (value.length > 2) {
                        value = value.slice(-2);
                    }
                    const numericValue = parseInt(value, 10);
                    if (isNaN(numericValue) || numericValue < 0 || numericValue > 59) {
                        value = '00';
                    }
                    setSeconds(value.padStart(2, '0'));
                }}
                min="0"
                max="59"
            />
            .
            <input
                type="number"
                value={milliseconds}
                onChange={(e) => {
                    let value = e.target.value;
                    if (value.length > 3) {
                        value = value.slice(-3);
                    }
                    const numericValue = parseInt(value, 10);
                    if (isNaN(numericValue) || numericValue < 0 || numericValue > 999) {
                        value = '000';
                    }
                    setMilliseconds(value.padStart(3, '0'));
                }}
                min="0"
                max="999"
            />
        </div>
    );
};

export default TimeInput;
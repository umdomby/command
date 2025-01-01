'use client';

import React, {useEffect, useState} from 'react';


interface Props {
    className?: string;
    medals: any[];
    countMedals: any[];
}

export const GameRecord_MEDAL: React.FC<Props> = ({medals, countMedals}) => {

    console.log(medals);
    console.log(countMedals);

    return (
        <div>
            {medals.map((medal, index) => (
                <div key={index}>
                    <span className="ml-2">{medal.productName}:</span>
                    <span className="ml-2">"gold" {medal.gold !== null && "gold " + medal.gold.user.fullName + " " + medal.gold.timestate.substring(3)}</span>
                    <span className="ml-2">"silver" {medal.silver !== null && "silver " + medal.silver.user.fullName + " " + medal.silver.timestate.substring(3)}</span>
                    <span className="ml-2"> {medal.bronze !== null && "bronze " + medal.bronze.user.fullName + " " + medal.bronze.timestate.substring(3)}</span>
                </div>
            ))}
        </div>
    );
};


import React from 'react';

interface User {
    fullName: string;
    points: number;
    createdAt: Date;
}

interface Props {
    className?: string;
    users: User[];
}

export const Rating: React.FC<Props> = ({className, users}) => {
    return (
        <div className={className}>
            <h1 className="text-2xl font-bold text-center mb-6 p-2 bg-gray-400 rounded-lg">
                Rating
            </h1>
            {users.map((user, index) => (
                <div key={index} className="flex justify-between items-center mb-4 border-b pb-2">
                    <div className="flex-1 text-center px-2">
                        {user.points}
                    </div>
                    <div className="flex-1 text-center px-2">
                        {user.fullName}
                    </div>
                    <div className="flex-1 text-center px-2">
                        {user.createdAt.toLocaleDateString()}
                    </div>
                </div>
            ))}
        </div>
    );
};
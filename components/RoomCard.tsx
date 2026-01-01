import React from 'react';
import Link from 'next/link';
import { Room } from '@/types';
import Button from './ui/Button';

interface RoomCardProps {
  room: Room;
}

export default function RoomCard({ room }: RoomCardProps) {
  return (
    <div className="flex flex-col justify-between bg-white border-4 border-black shadow-neo p-6 h-full transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div>
        {/* Header: Host & Topic */}
        <div className="flex items-center justify-between mb-4">
          <span className="flex items-center gap-2 text-xs font-bold uppercase bg-main px-2 py-1 border-2 border-black rounded-full">
            @{room.host.username || 'HOST'}
          </span>
          <span className="text-xs text-gray-500 font-bold">
            {new Date(room.created).toLocaleDateString()}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-2xl font-heading mb-2 truncate" title={room.name}>
          {room.name}
        </h3>
        <p className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">
          {room.topic}
        </p>
        <p className="text-sm text-gray-600 line-clamp-3 mb-6 font-base">
          {room.description || 'No description provided.'}
        </p>
      </div>

      {/* Footer Action */}
      <Link href={`/room/${room.id}`}>
        <Button variant="secondary" className="w-full text-sm">
          JOIN ROOM
        </Button>
      </Link>
    </div>
  );
}
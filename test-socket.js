const io = require('socket.io-client');

console.log('Testing Socket.IO connection...');

const socket = io('http://localhost:8787', {
  autoConnect: true,
  reconnection: false,
});

socket.on('connect', () => {
  console.log('✅ Connected successfully:', socket.id);
  
  // Test creating a room
  console.log('📤 Sending create_room message...');
  socket.emit('message', { t: 'create_room' });
});

socket.on('message', (data) => {
  console.log('📨 Received message:', data);
  
  if (data.t === 'room_created') {
    console.log('✅ Room created successfully:', data.room, 'HostKey:', data.hostKey);
    
    // Test joining the room
    console.log('📤 Sending join_room message...');
    socket.emit('message', { 
      t: 'join_room', 
      room: data.room, 
      name: 'TestPlayer' 
    });
  } else if (data.t === 'joined') {
    console.log('✅ Joined room successfully. Player ID:', data.you);
    console.log('👥 Seats:', data.seats);
    process.exit(0);
  }
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});

// Timeout after 5 seconds
setTimeout(() => {
  console.log('⏰ Timeout - closing connection');
  socket.close();
  process.exit(0);
}, 5000);

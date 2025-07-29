// File: apps/backend/test-realtime-debug.ts

import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:80', {
  transports: ['websocket']
});

console.log('🔌 Attempting connection to http://localhost:80...');

// Catch ALL events
socket.onAny((eventName: string, ...args: any[]) => {
  console.log(`\n📨 Event received: "${eventName}"`);
  console.log('Data:', JSON.stringify(args, null, 2));
});

socket.on('connect', () => {
  console.log('\n✅ Connected! Socket ID:', socket.id);
  console.log('🔄 Sending subscribe request...');
  
  // Send subscribe request
  socket.emit('subscribe', { tables: ['users', 'user_login_details', 'mfa'] }, (response: any) => {
    console.log('📥 Subscribe acknowledgment:', response);
  });
});

socket.on('test', (data: any) => {
  console.log('\n🧪 Test message received:', data);
});

socket.on('subscribed', (data: any) => {
  console.log('\n✅ Subscription confirmed:', data);
});

socket.on('dataChange', (payload: any) => {
  console.log('\n🔔 REAL-TIME UPDATE (dataChange):');
  console.log(JSON.stringify(payload, null, 2));
});

socket.on('debug:dataChange', (payload: any) => {
  console.log('\n🔔 REAL-TIME UPDATE (debug):');
  console.log(JSON.stringify(payload, null, 2));
});

socket.on('error', (error: Error) => {
  console.error('\n❌ Socket error:', error);
});

socket.on('connect_error', (error: Error) => {
  console.error('\n❌ Connection error:', error.message);
});

socket.on('disconnect', (reason: string) => {
  console.log('\n🔌 Disconnected. Reason:', reason);
});

// Keep alive
setInterval(() => {
  if (socket.connected) {
    console.log('🔔 Still connected...');
  }
}, 10000);

process.on('SIGINT', () => {
  console.log('\n👋 Closing...');
  socket.disconnect();
  process.exit(0);
});
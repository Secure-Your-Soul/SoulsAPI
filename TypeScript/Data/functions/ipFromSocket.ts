import { Socket } from 'node:net';

const ipFromSocket = (s: Socket): string => (s.remoteAddress ?? '').replace(/^::ffff:/, '');

export default ipFromSocket;
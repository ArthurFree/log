import Log, { log } from './log';
import test from './test';

// const log = new Log();

console.log('==== Log index ====', new Log().getConfig())

log('hello', { a: 1 });
log('hello', 'world');
// log('==== hello1 ====', 'world');
// log('==== hello2 ====', 'world');
// log('==== hello3 ====', 'world');

test();

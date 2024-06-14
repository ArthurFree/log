import Log from "./log";

const log = new Log();

console.log('==== Log test ====', log.getConfig())

window.addEventListener('click', () => {
    log.log('click', 'Click event')
})

export default function test() {
    log.log('test.ts', 'Hello', 'World!')
    log.log('test.ts1', 'Hello, World!')
    log.log('test.ts2', 'Hello, World!')
    log.log('test.ts3', 'Hello, World!')
}

import sinon from 'sinon';

export const mockLogger = () => ({ log: sinon.fake(), error: sinon.fake() });



////////////////////////////////////////////////////////////////////////////////
// setTimeout()

// In case setTimeout() is faked
const nativeSetTimeout = setTimeout;

export const wait = (delay = 0) => new Promise(resolve => {
  nativeSetTimeout(resolve, delay);
});

export const waitUntil = (f) => new Promise(resolve => {
  const waiter = () => {
    if (f())
      resolve();
    else
      nativeSetTimeout(waiter, 10);
  };
  waiter();
});

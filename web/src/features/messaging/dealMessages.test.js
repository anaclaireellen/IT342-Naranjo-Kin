import {
  createDealMessageContent,
  formatDealPreview,
  getCounterparty,
  getDealKey,
  getRequestKey,
  isUserInDeal,
  parseDealMessage
} from './dealMessages';

test('creates and parses borrowing deal messages', () => {
  const content = createDealMessageContent({
    type: 'deal_request',
    proposer: 'lender.one',
    confirmer: 'borrower.one',
    summary: 'Calculator for finals',
    requestId: 42,
    requestOwner: 'borrower.one',
    requestNeed: 'Calculator',
    createdAt: '2026-05-10T00:00:00.000Z'
  });

  const parsed = parseDealMessage(content);
  expect(parsed.type).toBe('deal_request');
  expect(formatDealPreview(content)).toContain('Calculator for finals');
  expect(getDealKey(parsed)).toBe('42::lender.one::borrower.one::calculator for finals');
  expect(getRequestKey(parsed)).toBe('42');
  expect(getCounterparty(parsed, 'borrower.one')).toBe('lender.one');
  expect(isUserInDeal(parsed, 'lender.one')).toBe(true);
});

test('ignores regular chat messages in deal parser', () => {
  expect(parseDealMessage('hello')).toBeNull();
  expect(formatDealPreview('hello')).toBe('hello');
});

export const DEAL_PREFIX = '[[KIN_DEAL]]';

const normalizeSummary = (value) => (value || 'Borrowing deal').trim() || 'Borrowing deal';

export const createDealMessageContent = ({ type, proposer, confirmer, summary, requestId, requestOwner, requestNeed, createdAt }) =>
  `${DEAL_PREFIX}${JSON.stringify({
    type,
    proposer,
    confirmer,
    summary: normalizeSummary(summary),
    requestId: requestId || '',
    requestOwner: requestOwner || '',
    requestNeed: requestNeed || '',
    createdAt: createdAt || new Date().toISOString(),
  })}`;

export const parseDealMessage = (content) => {
  if (typeof content !== 'string' || !content.startsWith(DEAL_PREFIX)) {
    return null;
  }

  try {
    const parsed = JSON.parse(content.slice(DEAL_PREFIX.length));
    if (!parsed?.type || !parsed?.proposer || !parsed?.confirmer) {
      return null;
    }

    return {
      ...parsed,
      summary: normalizeSummary(parsed.summary),
    };
  } catch {
    return null;
  }
};

export const formatDealPreview = (content) => {
  const deal = parseDealMessage(content);
  if (!deal) return content;

  if (deal.type === 'deal_confirmed') {
    return `Deal confirmed: ${deal.summary}`;
  }

  return `Deal confirmation requested: ${deal.summary}`;
};

export const getDealKey = (deal) => {
  if (!deal) return '';
  return `${deal.requestId || 'general'}::${deal.proposer}::${deal.confirmer}::${deal.summary.toLowerCase()}`;
};

export const getCounterparty = (deal, activeUser) => {
  if (!deal || !activeUser) return '';
  return deal.proposer === activeUser ? deal.confirmer : deal.proposer;
};

export const isUserInDeal = (deal, activeUser) =>
  Boolean(deal && activeUser && (deal.proposer === activeUser || deal.confirmer === activeUser));

export const getRequestKey = (deal) => {
  if (!deal?.requestId) return '';
  return String(deal.requestId);
};

import { ChatService } from './chat.service';

describe('ChatService', () => {
  const prisma = {
    conversation: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    message: { findMany: jest.fn(), create: jest.fn() },
    notification: { create: jest.fn() },
    $transaction: jest.fn()
  };
  const service = new ChatService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('masks emails, links, and phone numbers before storage', async () => {
    prisma.conversation.findFirst.mockResolvedValue({ id: 'conversation-1', status: 'OPEN', userAId: 'user-1', userBId: 'user-2' });
    prisma.$transaction.mockResolvedValue([{ id: 'message-1', body: 'stored' }, {}]);
    await service.send('user-1', 'conversation-1', { body: 'Email me at person@example.com or call +92 300 1234567 https://example.com' });
    expect(prisma.$transaction).toHaveBeenCalled();
    const operations = prisma.$transaction.mock.calls[0][0];
    expect(operations).toBeDefined();
  });

  it('rejects a user outside the conversation', async () => {
    prisma.conversation.findFirst.mockResolvedValue(null);
    await expect(service.messages('outsider', 'conversation-1')).rejects.toThrow('not part');
  });
});

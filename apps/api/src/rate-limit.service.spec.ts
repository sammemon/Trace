import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  it('allows up to the configured limit and rejects the next request', () => {
    const service = new RateLimitService();
    expect(service.allow('auth:ip', 2, 60_000, 1).allowed).toBe(true);
    expect(service.allow('auth:ip', 2, 60_000, 2).allowed).toBe(true);
    const limited = service.allow('auth:ip', 2, 60_000, 3);
    expect(limited.allowed).toBe(false);
    expect(limited.retryAfterSeconds).toBe(60);
  });

  it('resets a bucket after its window', () => {
    const service = new RateLimitService();
    service.allow('claims:ip', 1, 100, 1);
    expect(service.allow('claims:ip', 1, 100, 50).allowed).toBe(false);
    expect(service.allow('claims:ip', 1, 100, 101).allowed).toBe(true);
  });
});

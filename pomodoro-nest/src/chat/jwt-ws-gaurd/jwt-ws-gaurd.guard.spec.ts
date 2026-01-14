import { JwtWsGaurdGuard } from './jwt-ws-gaurd.guard';

describe('JwtWsGaurdGuard', () => {
  it('should be defined', () => {
    expect(new JwtWsGaurdGuard()).toBeDefined();
  });
});

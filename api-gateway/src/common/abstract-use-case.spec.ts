import { describe, it, expect } from 'vitest';
import { AbstractUseCase } from './abstract-use-case';

interface TestInput {
  value: number;
}

interface TestOutput {
  result: number;
}

class DoubleUseCase extends AbstractUseCase<TestInput, TestOutput> {
  async execute(input: TestInput): Promise<TestOutput> {
    return { result: input.value * 2 };
  }
}

describe('AbstractUseCase', () => {
  it('should enforce execute method contract', async () => {
    const useCase = new DoubleUseCase();
    const output = await useCase.execute({ value: 5 });

    expect(output.result).toBe(10);
  });

  it('should return a Promise', () => {
    const useCase = new DoubleUseCase();
    const result = useCase.execute({ value: 1 });

    expect(result).toBeInstanceOf(Promise);
  });
});

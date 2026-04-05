export abstract class AbstractUseCase<Input, Output> {
  abstract execute(input: Input): Promise<Output>;
}

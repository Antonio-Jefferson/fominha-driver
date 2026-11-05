import { act, renderHook } from "@testing-library/react-native";
import { interpolate, isTeleport, useAnimatedPosition } from "./animatedPosition";

const A = { latitude: -3.66, longitude: -45.38 };
const B = { latitude: -3.661, longitude: -45.381 };

describe("interpolate", () => {
  it("anda em linha reta e não passa do destino", () => {
    expect(interpolate(A, B, 0.5).latitude).toBeCloseTo(-3.6605, 6);
    expect(interpolate(A, B, 2)).toEqual(B);
  });
});

describe("isTeleport", () => {
  it("separa movimento de salto", () => {
    expect(isTeleport(A, B)).toBe(false);
    expect(isTeleport(A, { latitude: -3.3, longitude: -45.38 })).toBe(true);
  });
});

describe("useAnimatedPosition", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("desliza até o novo ponto em vez de pular", () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: typeof A | null }) => useAnimatedPosition(target, 1000),
      { initialProps: { target: A as typeof A | null } }
    );
    expect(result.current).toEqual(A);

    rerender({ target: B });
    act(() => jest.advanceTimersByTime(500));
    expect(result.current!.latitude).toBeLessThan(A.latitude);
    expect(result.current!.latitude).toBeGreaterThan(B.latitude);

    act(() => jest.advanceTimersByTime(600));
    expect(result.current).toEqual(B);
  });

  it("some junto com a posição", () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: typeof A | null }) => useAnimatedPosition(target, 1000),
      { initialProps: { target: A as typeof A | null } }
    );
    rerender({ target: null });
    expect(result.current).toBeNull();
  });
});

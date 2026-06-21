import { isEqual } from "lodash";
import { useEffect, useRef } from "react";

function isPrimitive(val: any) {
  return val === null || (typeof val !== "object" && typeof val !== "function");
}

/**
 * useDeepCompareEffect:
 * Runs the effect only when dependencies actually change.
 * - Uses `===` for primitives
 * - Uses deep equality (lodash.isEqual) for objects/arrays/functions
 */
export function useDeepCompareEffect(
  effect: React.EffectCallback,
  deps: any[],
) {
  const prevDeps = useRef<any[]>();

  const hasChanged =
    !prevDeps.current ||
    deps.some((dep, i) => {
      const prev = prevDeps.current?.[i];
      return isPrimitive(dep) && isPrimitive(prev)
        ? dep !== prev
        : !isEqual(dep, prev);
    });

  useEffect(() => {
    if (hasChanged) {
      prevDeps.current = deps;
      return effect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps); // deps still passed for linting
}

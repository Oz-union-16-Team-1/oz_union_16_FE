import { create } from 'zustand';

interface TestState {
  count: number;
  increase: () => void;
  decrease: () => void;
}

export const useTestStore = create<TestState>((set) => ({
  count: 0,
  increase: () => set((state) => ({ count: state.count + 1 })),
  decrease: () => set((state) => ({ count: state.count - 1 })),
}));

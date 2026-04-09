// src/App.tsx
import { useTestStore } from './store/useTestStore';

function App() {
  const { count, increase, decrease } = useTestStore(); // 2단계에서 만든 Zustand 연결!

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100">
      <h1 className="text-3xl font-bold text-blue-600">
        PGTI 프로젝트 초기 세팅
      </h1>

      <div className="flex flex-col items-center rounded-lg bg-white p-6 shadow-md">
        <p className="mb-4 text-xl">
          Zustand 테스트 (Count):{' '}
          <span className="font-mono font-bold text-red-500">{count}</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={increase}
            className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            증가
          </button>
          <button
            onClick={decrease}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            감소
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500">이제 컴포넌트 작업할일만 남음</p>
    </div>
  );
}

export default App;

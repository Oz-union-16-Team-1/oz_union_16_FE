// src/App.tsx
import { useTestStore } from './store/useTestStore';

function App() {
  const { count, increase, decrease } = useTestStore(); // 2단계에서 만든 Zustand 연결!

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 gap-4">
      <h1 className="text-3xl font-bold text-blue-600">
        PGTI 프로젝트 초기 세팅 완료! 🚀
      </h1>

      <div className="p-6 bg-white rounded-lg shadow-md flex flex-col items-center">
        <p className="text-xl mb-4">
          Zustand 테스트 (Count):{' '}
          <span className="font-mono font-bold text-red-500">{count}</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={increase}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            증가
          </button>
          <button
            onClick={decrease}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            감소
          </button>
        </div>
      </div>

      <p className="text-gray-500 text-sm">
        이제 3단계 Axios로 넘어갈 준비가 되었습니다!
      </p>
    </div>
  );
}

export default App;

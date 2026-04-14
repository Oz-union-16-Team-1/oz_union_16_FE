import Header from './components/common/Header';
import { useTestStore } from './store/useTestStore';

function App() {
  const { count, increase, decrease } = useTestStore();

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="flex flex-col">
        <Header fixed={false} />

        <section className="mt-20 flex flex-col items-center bg-gray-100 px-6 py-10 shadow-md">
          <p className="mb-4 text-xl">
            Zustand 테스트 (Count):{' '}
            <span className="font-mono font-bold text-red-500">{count}</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={increase}
              className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
            >
              증가
            </button>
            <button
              type="button"
              onClick={decrease}
              className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            >
              감소
            </button>
          </div>
        </section>

        <h1 className="px-6 text-center text-3xl font-bold text-blue-600">
          PGTI 프로젝트 초기 세팅
        </h1>
        <p className="text-center text-sm text-gray-500">
          이제 컴포넌트 작업할일만 남음
        </p>
      </main>
    </div>
  );
}

export default App;

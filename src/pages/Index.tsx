import { ImageEnhancer } from '@/components/ImageEnhancer';
import { Header } from '@/components/Header';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-12">
        <ImageEnhancer />
      </main>
    </div>
  );
};

export default Index;

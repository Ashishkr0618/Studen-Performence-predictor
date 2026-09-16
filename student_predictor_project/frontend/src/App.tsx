import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import UploadPage from "@/pages/Upload";
import TrainPage from "@/pages/Train";
import PredictPage from "@/pages/Predict";
import AnalyticsPage from "@/pages/Analytics";
import Layout from "@/components/Layout";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={UploadPage} />
        <Route path="/train" component={TrainPage} />
        <Route path="/predict" component={PredictPage} />
        <Route path="/analytics" component={AnalyticsPage} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

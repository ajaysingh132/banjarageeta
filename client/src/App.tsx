import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Chapters from "./pages/Chapters";
import ChapterDetail from "./pages/ChapterDetail";
import StoryBoard from "./pages/StoryBoard";
import SceneEditor from "./pages/SceneEditor";
import AIChat from "./pages/AIChat";
import AdminPanel from "./pages/AdminPanel";
import PDFViewer from "./pages/PDFViewer";
import Progress from "./pages/Progress";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"}>
        {(params) => (
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/chapters"}>
        {(params) => (
          <DashboardLayout>
            <Chapters />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/chapters/:id"}>
        {(params) => (
          <DashboardLayout>
            <ChapterDetail id={Number(params.id)} />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/storyboard"}>
        {(params) => (
          <DashboardLayout>
            <StoryBoard />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/scenes/:shlokaId"}>
        {(params) => (
          <DashboardLayout>
            <SceneEditor shlokaId={Number(params.shlokaId)} />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/ai-chat"}>
        {(params) => (
          <DashboardLayout>
            <AIChat />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/admin"}>
        {(params) => (
          <DashboardLayout>
            <AdminPanel />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/pdf"}>
        {(params) => (
          <DashboardLayout>
            <PDFViewer />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/progress"}>
        {(params) => (
          <DashboardLayout>
            <Progress />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster position="bottom-right" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

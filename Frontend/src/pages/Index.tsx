import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskList } from '@/components/tasks/TaskList';
import { DependencyGraph } from '@/components/graph/DependencyGraph';
import { ClipboardList, Network } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Task Dependency Tracker</h1>
          <p className="text-muted-foreground mt-1">
            Manage tasks and visualize their dependencies
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Task Management
            </TabsTrigger>
            <TabsTrigger value="graph" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Graph Visualization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <TaskList />
          </TabsContent>

          <TabsContent value="graph">
            <DependencyGraph />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;

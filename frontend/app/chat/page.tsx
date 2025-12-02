import GradientBackground from "@/src/components/ui/gradient-background";
import { Sidebar } from "@/src/components/ui/sidebar";
import { AI_Prompt } from "@/src/components/ui/animated-ai-input";

export default function ChatPage() {
    return (
        <Sidebar>
            <GradientBackground>
                <div className="flex flex-col items-center justify-center min-h-screen w-full px-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-[#0f7d70] mb-8 text-center font-silver">
                        What do you want to generate today?
                    </h1>
                    <AI_Prompt />
                </div>
            </GradientBackground>
        </Sidebar>
    );
}

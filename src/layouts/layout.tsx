import { SidebarProvider, SidebarTrigger } from "@/components/sidebar";
import { AppSidebar } from "@/features/sidebar/app-sidebar";
import FirstPage from "@/pages/FirstPage";

export default function Layout() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<main>
				<SidebarTrigger />
				<FirstPage />
			</main>
		</SidebarProvider>
	);
}

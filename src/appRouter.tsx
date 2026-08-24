import { createBrowserRouter } from "react-router";
import PublictRouter from "./publictRouter/PublictRouter";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UpcomingReleasesPage from "./pages/UpcomingReleasesPage";
import MovieDetailPage from "./pages/MovieDetailPage";

export const router = createBrowserRouter(
    [
        {
            path:"/",
            element:<PublictRouter/>,
            children:[
                {
                    index:true,
                    element:<LoginPage/>
                },
                {
                    path:"register",
                    element:<RegisterPage/>
                },
                {
                    path:"proximos-estrenos",
                    element:<UpcomingReleasesPage/>
                },
                {
                    path:"proximos-estrenos/:id",
                    element:<MovieDetailPage/>
                }
            ]
        }
    ]
)
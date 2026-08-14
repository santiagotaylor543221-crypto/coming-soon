import { createBrowserRouter } from "react-router";
import PublictRouter from "./publictRouter/PublictRouter";
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"

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
                }
            ]
        }
    ]
)
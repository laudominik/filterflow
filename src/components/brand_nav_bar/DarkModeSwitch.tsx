import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";


export default function DarkModeSwitch(){
    
    const [enabled, setEnabled] = useState(false)
    function HandleClick() {
        setEnabled(!enabled);
        let newTheme = enabled ? "light" : "dark"
        sessionStorage.setItem("colorTheme", newTheme)
        document.documentElement.setAttribute('data-bs-theme', newTheme)

    }

    useEffect(()=>{
        let currentTheme = sessionStorage.getItem("colorTheme")
        if(currentTheme){
            document.documentElement.setAttribute('data-bs-theme', currentTheme)
            setEnabled(currentTheme === "dark")
        }
    }, [])
    return <div className="navModeButton" onClick={()=>HandleClick()}><FontAwesomeIcon icon={enabled ? faMoon : faSun}/></div>

}
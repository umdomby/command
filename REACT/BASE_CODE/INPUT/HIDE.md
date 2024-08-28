
const [hideDescription, setHideDescription] = useState(true)

{hideDescription ?
    <div>
        No Account? <NavLink to={REGISTRATION_ROUTE}>Registration!</NavLink>
    </div>
    :
    <div>
        Account? <NavLink to={LOGIN_ROUTE}>ENTER!</NavLink>
    </div>
}
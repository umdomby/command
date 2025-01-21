import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


<div className="flex justify-between items-center">
    <div>
        <p>Ваши баллы: {userUp?.points}</p>
    </div>
    <div className="flex justify-end">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-5">Фильтр: {statusFilter}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Фильтр по статусу</DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuRadioGroup value={statusFilter} onValueChange={(value) => setStatusFilter(value as BetStatus)}>
                    <DropdownMenuRadioItem value={BetStatus.OPEN}>OPEN</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={BetStatus.CLOSED}>CLOSED</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</div>

при добавлении ставки данные обновляются даже если окно браузера не активно, при закрытии ставки не обновляются при не активном окне браузера
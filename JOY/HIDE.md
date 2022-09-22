const Search = () => {
const [showResults, setShowResults] = React.useState(false)
const onClick = () => setShowResults(true)
return (
<div>
<input type="submit" value="Search" onClick={onClick} />
{ showResults ? <Results /> : null }
</div>
)
}

const Results = () => (
  <div id="results" className="search-results">
    Some Results
  </div>
)

ReactDOM.render(<Search />, document.querySelector("#container"))

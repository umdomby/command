<select
    id="voice"
    name="voice"
    style={{width:'100px'}}
    value={voiceIndex || ''}
    onChange={(event) => {
        localStorage.setItem('voicesId', event.target.value)
        setVoiceIndex(event.target.value);
        console.log(event.target.value)
    }}
>

    <option value="">Default</option>
    {voices.map((option, index) => (
        <option key={option.voiceURI} value={index}>
            {`${option.lang} - ${option.name}`}
        </option>
    ))}
</select>
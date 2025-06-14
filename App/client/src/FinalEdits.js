import React, {useEffect, useState} from 'react';
import Carousel from 'react-bootstrap/Carousel';

export const FinalEdits = ({url, finalClips, clipCount}) => {
    const [subLocation, setSubLocation] = useState(false)
    const [completed, setCompleted] = useState(false)
    const [updatedIdClips, setUpdatedIdClips] = useState([])

    async function finalEdits(mode, url, clips){
        try {
            const res = await (await fetch('http://127.0.0.1:5000/final_edits',
            {
            method: 'POST',
            cache: "no-cache",
            headers: {
                'Content-type':'application/json', 
            },
            body: JSON.stringify([mode, url, clips])
            })).json()
            return res.data && setCompleted(true)
        } catch(e) {
            console.log("Error. Please check URL")
        }
    }

    async function finalFileClean(clipCount){
        try {
            const res = await (await fetch('http://127.0.0.1:5000/final_file_move',
            {
            method: 'POST',
            cache: "no-cache",
            headers: {
                'Content-type':'application/json', 
            },
            body: JSON.stringify(clipCount)
            })).json()
            return res.data && window.location.reload()
        } catch(e) {
            console.log("Error. Please check URL")
        }
    }

    useEffect(() => {
            let clipCounter = 1
            setUpdatedIdClips(finalClips.map((clip) => {
                return {id: clipCounter++}
            }))
        }, [])

    const handleSubLocation = (e) => {
        e.preventDefault()
        setSubLocation(e.target.id)
        finalEdits(e.target.id, url, finalClips)
    }

    const handleRestart = (e) => {
        e.preventDefault()
        console.log(clipCount)
        finalFileClean(clipCount)
    }

    return (
        <div>
            {!subLocation ? (
                <>
                <h2 className="subs-header pb-0" >Please select the format of your subtitles:</h2>
                <p class='ps-4 text-center'><b>*Note: </b>If you choose to add subtitles, <i>ClipIt!</i> will first look if the video has subtitles included. If it does not, the subtitles will be auto-generated.</p>
                <div class="subs row mb-5" >
                    <div class="subs-options col-3">
                        <h3>No subtitles</h3>
                        <button><img src="/none.PNG" alt="No subtitles" title="no subtitles" id="none" height="768" width="432" onClick={(e) => handleSubLocation(e)}/></button>
                    </div>
                    <div class="subs-options offset-1 col-3">
                        <h3>Subtitles</h3>
                        <button><img src="/above.PNG" alt="Subtitles" title="subtitles" id="subtitles" height="768" width="432" onClick={(e) => handleSubLocation(e)}/></button>
                    </div>
                </div>
                </>
            ) : (
                <>
                {!completed ? (
                    <>
                    <h1 className="final-edits">Completing final edits. This may take several minutes</h1>
                    </>
                ) : (
                    <>
                    <h1 className="finished">Clips completed! Thank you for using ClipIt!</h1>
                    <Carousel id="final-carousel" controls={true} interval={null}>
                    {updatedIdClips.map((clip) => {
                        return(
                            <Carousel.Item key={clip.id}>
                                <div className="final-videos">
                                    <video src={`clip${clip.id}.mp4`} controls/>
                                </div>
                            </Carousel.Item>
                        )
                    })}
                    </Carousel>
                    <div className="finish-prompt">
                        <h3>Click Finish to move clips to Downloads folder</h3>
                    </div>
                    <div className="finish-container">
                        <button className="finish" onClick={(e) => handleRestart(e)}>Finish</button>
                    </div>
                    </>
                )}
                </>
            )}
        </div>
    )
}

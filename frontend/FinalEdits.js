import React, {useState} from 'react';
import Carousel from 'react-bootstrap/Carousel';

export const FinalEdits = ({url, finalClips, clipCount}) => {
    const [subLocation, setSubLocation] = useState(false)
    const [completed, setCompleted] = useState(false)

    async function finalEdits(mode, url, clips){
        try {
            const res = await (await fetch('http://localhost:5000/final_edits',
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
            const res = await (await fetch('http://localhost:5000/final_file_move',
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
                <h2 className="subs-header" >Please select the format of your subtitles:</h2>
                <div className="subs" >
                    <div className="subs-options">
                        <h3>No subtitles</h3>
                        <button><img src="/none.PNG" alt="no subtitles" title="no subtitles" id="none" height="768" width="432" onClick={(e) => handleSubLocation(e)}/></button>
                    </div>
                    <div className="subs-options">
                        <h3>Subtitles above splitscreen</h3>
                        <button><img src="/above.PNG" alt="subtitles above splitscreen" title="above" id="above" height="768" width="432" onClick={(e) => handleSubLocation(e)}/></button>
                    </div>
                    <div className="subs-options">
                        <h3>Subtitles below splitscreen</h3>
                        <button><img src="/below.PNG" alt="subtitles below splitscreen" title="below" id="below" height="768" width="432" onClick={(e) => handleSubLocation(e)}/></button>
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
                    {finalClips.map((clip) => {
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

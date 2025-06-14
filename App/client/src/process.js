import React, {useState} from 'react';
import {LoadingSpinner} from './LoadingSpinner';
import { ClipDownloader } from './ClipDownloader';

export const StartDownloads = ({url, finalClips, splitscreenUrl, splitscreenClips, subLocation, onCancel}) => {
    const [completed, setCompleted] = useState(false)
    const [isDownloading, setIsDownloading] = useState(true)
    const [splitDownloading, setSplitDownloading] = useState(true)
    const [isEditing, setIsEditing] = useState(true)
    const [subsAdded, setSubsAdded] = useState(false)
    const [splitscreenAdded, setSplitscreenAdded] = useState(false)

    // async function downloadClips(mode, mode_url, mode_clips){
    //     try {
    //         const res = await (await fetch('http://localhost:5000/download_clips',
    //         {
    //         method: 'POST',
    //         cache: "no-cache",
    //         headers: {
    //             'Content-type':'application/json', 
    //         },
    //         body: JSON.stringify([mode, mode_url, mode_clips])
    //         })).json()
    //         res.data && mode === 1 ? setIsDownloading(false) : setSplitDownloading(false)
    //     } catch(e) {
    //         console.log("Error. Please check URL")
    //     }
    // }

    function handleDownload(mode){
        console.log(mode)
        mode === 1 ? setIsDownloading(false) : setSplitDownloading(false)
    }

    async function addSubs(mode, url, clips){
        try {
            const res = await (await fetch('http://127.0.0.1:5000/add_subtitles',
            {
            method: 'POST',
            cache: "no-cache",
            headers: {
                'Content-type':'application/json', 
            },
            body: JSON.stringify([mode, url, clips])
            })).json()
            res.data && mode === 1 ? setSubsAdded(true) : setIsEditing(false)
        } catch(e) {
            console.log("Error. Please check URL")
        }
    }

    function handleSubs(mode, url, clips){
        addSubs(mode, url, clips)
    }

    async function addSplitscreen(mode){
        try {
            const res = await (await fetch('http://127.0.0.1:5000/add_splitscreen',
            {
            method: 'POST',
            cache: "no-cache",
            headers: {
                'Content-type':'application/json', 
            },
            body: JSON.stringify([mode, finalClips])
            })).json()
            res.data && mode === 1 ? setIsEditing(false) : setSplitscreenAdded(true)
        } catch(e) {
            console.log("Error. Please check URL")
        }
    }

    function handleSplitscreen(mode){
        addSplitscreen(mode)
    }

    async function cleanFiles(mode){
        try {
            const res = await (await fetch('http://127.0.0.1:5000/clean_files',
            {
            method: 'POST',
            cache: "no-cache",
            headers: {
                'Content-type':'application/json', 
            },
            body: JSON.stringify(mode)
            })).json()
            res.data && setCompleted(true)
        } catch(e) {
            console.log("Error. Please check URL")
        }
    }

    function handleClean(mode){
        cleanFiles(mode)
    }

    function displayFinalClips(){
        let i = 0
        finalClips.map((clip) => {
            i++
            return (
                <video width="560" height="315" controls>
                    <source src={`/clips/clip${i}.mp4`} type="video/mp4"/>
                </video>
            )
        })
    }

    return (
        <div>
            {!completed ? (
                <>
                <h1>Clipping! This may take several minutes...</h1>
                {isDownloading ? (
                    <>
                    {/* <h2>Downloading clips</h2>
                    <LoadingSpinner/>
                    {handleDownload(1, url, finalClips)}
                    </> */}
                    <ClipDownloader url={url} clips={finalClips} splitscreenUrl={splitscreenUrl} splitscreenClips={splitscreenClips}/>
                    </>
                ) : (
                    <>
                    {isEditing ? (
                        <>
                        {subLocation === "above" ? (
                            <>
                            {!subsAdded ? (
                                <>
                                <h2>Adding subtitles</h2>
                                <LoadingSpinner/>
                                {handleSubs(1, url, finalClips)}
                                </>
                            ) : (
                                <>
                                <h2>Adding splitscreen</h2>
                                <LoadingSpinner/>
                                {handleSplitscreen(1)}
                                </>
                            )} 
                            </>
                        ) : (
                            <>
                            {subLocation === "below" ? (
                                <>
                                {!splitscreenAdded ? (
                                <>
                                <h2>Adding splitscreen</h2>
                                <LoadingSpinner/>
                                {handleSplitscreen(-1)}
                                </>
                            ) : (
                                <>
                                <h2>Adding subtitles</h2>
                                <LoadingSpinner/>
                                {handleSubs(-1, url, finalClips)}
                                </>
                            )} 
                                </>
                            ) : (
                                <>
                                <h2>Adding splitscreen</h2>
                                <LoadingSpinner/>
                                {handleSplitscreen(0)}
                                </>
                            )}
                            </>
                        )}
                        </>
                    ) : (
                        <>
                        <h2>Cleaning files... this may take a few moments</h2>
                        {handleClean()}
                        </>
                    )}
                    </>
                )}
                </>
            ) : (
                <>
                <h1>Clips completed!</h1>
                {displayFinalClips()}
                </>
            )}
        </div>
    )
}
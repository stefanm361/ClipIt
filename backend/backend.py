from flask import Flask, request, jsonify
from flask_cors import CORS
import pysrt, re, os, requests, shutil, time
from googleapiclient.discovery import build
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip, ImageClip, clips_array
from moviepy.video.fx.all import crop
from pathlib import Path
API_KEY = "AIzaSyDNn1jUC1UbQvodXmAU8xIrzTVH9-dPg3E"

#TODO Need to clean up/delete subtitle file & make it so split screen times are rounded to next whole second

#Logic for connecting this python/flask backend to a react frontend
app = Flask(__name__)
CORS(app)
@app.route("/handle_url", methods = ["POST"])
def handle_url():
    video_url = request.json
    return get_data(video_url)

@app.route("/data")
def get_data(url):
    clip_data = find_hottest_clips(url)
    if clip_data == False:
        return jsonify(data="None")
    return jsonify(data=clip_data)

@app.route("/get_vid_duration", methods = ["POST"])
def get_duration():
    mode = request.json[0]
    url = request.json[1]
    if (mode == 1):
        return jsonify(data=HeatMapDataPoint.video_length)
    else:
        return jsonify(data=find_video_duration(url))
    
@app.route("/download_clips", methods = ["POST"])
def handle_downloads():
    url = request.json[0]
    clips = request.json[1]
    split_url = request.json[2]
    split_clips = request.json[3]

    print("\nDOWNLOAD CALLED\n")
    
    i = 0
    for clip in clips:
        i += 1
        download_clip(url, clip["start"], clip["end"], i)
        download_splitscreen(split_url, split_clips[i-1]["start"], split_clips[i-1]["end"], i)

    return jsonify(data=True)

@app.route("/final_edits", methods = ["POST"])
def handle_edits():
    mode = request.json[0]
    url = request.json[1]
    clips = request.json[2]
    
    if mode != "above":
        count = handle_splitscreen(mode, clips)
        if mode == "below":
            handle_subs(mode, url, clips)
    else:
        handle_subs(mode, url, clips)
        count = handle_splitscreen(mode, clips)

    clean_files(mode, count)
    
    return jsonify(data=True)
    

@app.route("/add_subtitles")
def handle_subs(mode, url, clips):
    
    print("\n\nSUBTITLES CALLED --> MODE: {}\n\n".format(mode))

    subs_found = download_subs(url)
    dir = os.getcwd()
    if mode == "above":
        if os.path.isdir(dir + "/subbed") == False:
            os.mkdir(dir + "/subbed")

    if subs_found == False:
        i = 0
        for clip in clips:
            i += 1
            print("Clip duration: {}".format(clip["end"] - clip["start"]))
            start = time.time()
            add_auto_subs(mode, "clip{}".format(i))
            end = time.time()
            print("Subtitles added for clip {} in {} seconds".format(i, end - start))
    else:
        i = 0
        for clip in clips:
            i += 1
            print("Clip duration: {}".format(clip["end"] - clip["start"]))
            start = time.time()
            add_subtitles(mode, "clip{}".format(i), clip["start"], clip["end"], subs_found)
            end = time.time()
            print("Subtitles added for clip {} in {} seconds".format(i, end - start))
        os.remove(dir + "/" + subs_found)

    return jsonify(data=True)

@app.route("/add_splitscreen")
def handle_splitscreen(mode, clips):

    print("\n\nSPLITSCREEN CALLED --> MODE: {}\n\n".format(mode))

    if mode != "above":
        dir = os.getcwd()
        if os.path.isdir(dir + "/combined") == False:
            os.mkdir(dir + "/combined")

    i = 0
    for clip in clips:
        i += 1
        print("Clip duration: {}".format(clip["end"] - clip["start"]))
        start = time.time()
        add_splitscreen(mode, "clip{}".format(i), "split{}".format(i))
        end = time.time()
        print("Splitscreen added for clip {} in {} seconds".format(i, end - start))

    return i

@app.route("/clean_files", methods= ["POST"])
def clean_files(mode, clip_count):
    dir = os.getcwd()
    
    try:
        if mode == "above":
            shutil.rmtree(dir + "/subbed")
        else:
            shutil.rmtree(dir + "/combined")
        shutil.rmtree(dir + "/clips")
        shutil.rmtree(dir + "/split")
    except:
        print("An error removing the directory occurred")

    parent_dir = os.path.abspath(os.path.join(dir, os.pardir))

    for i in range(1, clip_count + 1):
        shutil.move("{}/clip{}.mp4".format(dir, i), "{}/client/public".format(parent_dir))
    
    return jsonify(data=True)

@app.route("/final_file_move", methods= ["POST"])
def clips_to_downloads():
    clip_count = request.json
    downloads_path = str(Path.home()/"Downloads")
    dir = os.getcwd()
    parent_dir = os.path.abspath(os.path.join(dir, os.pardir))

    for i in range(1, clip_count + 1):
        shutil.move("{}/client/public/clip{}.mp4".format(parent_dir, i), downloads_path)

    sub_pattern = re.compile("clip\.en.*\.vtt")

    for filepath in os.listdir(dir):
        if sub_pattern.match(filepath):
            os.remove(filepath)

    return jsonify(data=True)

class HeatMapDataPoint():
    """
    Class that restructures the json data containing the user's chosen youtube video's heatmap data.
    ...

    Attributes
    ----------
    total_avg_heat_score: float
        a float representing the average heat score of the entire video being analyzed
    video_length: int
        an integer representing the duration of the entire video being analyzed in milliseconds

    start_time: int
        an integer representing the start_time, in milliseconds, of the HeatMapDataPoint instance (relative to the video)
    end_time: int
        an integer representing the start_time, in milliseconds, of the HeatMapDataPoint instance (relative to the video)
    heat_scores: float list
        a list of floats representing the heat_scores of the data points being combined into each HeatMapDataPoint instance
    
    Methods
    -------
    is_above_avg_heat()
        Compares the heat score of the HeatMapDataPoint instance to the total average heat score of the video
        Returns True if the HeatMapDataPoint instance's heat score is higher than the total average, and False if not
    last_duration()
        Allows the user to update the duration attribute of the last HeatMapDataPoint instance if it is unequal to the duration of the other instances of the class (can happen with last data point)
    """
    total_avg_heat_score = 0 
    video_length = 0

    def __init__(self, start_time, end_time, heat_scores):
        self.start_time = start_time
        self.end_time = end_time
        self.avg_heat_score = sum(heat_scores) / len(heat_scores) if isinstance(heat_scores, list) else heat_scores

    def __lt__(self, other):
        return self.avg_heat_score < other.avg_heat_score

    def is_above_avg_heat(self):
        return self.avg_heat_score > HeatMapDataPoint.total_avg_heat_score

def find_hottest_clips(url):
    """Takes a youtube video url and gets data of its progress bar heat map.
    
    Parameters
    ----------
    url: str
        The url of the youtube video 

    Returns
    -------
    If valid url: list
        List returned from helper function find_peaks() with variable 'results' passed as a parameter
    If invalid url: str
        Returns an error message if url could not be properly handled
    """
    try:
        #Get the video id from the passed video url
        # video_id = re.search("v=.{11}", url).group()[2:]

        # New code for when frontend's connected, needs to be compatible with embed link not watch link
        video_id = re.search("embed/.{11}", url).group()[6:]

        #Get video's heatmap data by calling upon API
        response = requests.get('https://yt.lemnoslife.com/videos?part=mostReplayed&id={vid_id}'.format(vid_id= video_id))
        json_data = response.json()
        data_source = json_data.get("items")[0].get("mostReplayed").get("heatMarkers")
        print()
        print(data_source)
        print()

        results = [] 
        heat_scores = []
        start = 0
        marker_duration = data_source[0].get("heatMarkerRenderer").get("markerDurationMillis")
        total_avg_heat_score = 0

        if marker_duration <= 10000:
            group_duration = 30000
        elif marker_duration <= 30000:
            group_duration = 60000
        else:
            group_duration = marker_duration

        #Get heatmap data from API

        #TODO Can check if last data point does not have the standard duration --> time + marker_duration > marker_duration * 100
        for data in data_source:
            time = data.get("heatMarkerRenderer").get("timeRangeStartMillis")
            heat_score = data.get("heatMarkerRenderer").get("heatMarkerIntensityScoreNormalized")

            if group_duration == marker_duration:
                results.append(HeatMapDataPoint(time, time + marker_duration, heat_score))
                total_avg_heat_score += heat_score
            else:
                #Group and structure heatmap data
                if time + marker_duration - start <= group_duration:
                    heat_scores.append(heat_score)
                    continue

                data_point = HeatMapDataPoint(start, time, heat_scores)
                results.append(data_point)
                total_avg_heat_score += data_point.avg_heat_score
                heat_scores.clear()
                heat_scores.append(heat_score)
                start = time
            

        #Check for and append any remaining data to results
        if len(heat_scores) > 0:
            data_point = HeatMapDataPoint(start, time + marker_duration, heat_scores)
            results.append(data_point)

        HeatMapDataPoint.total_avg_heat_score = total_avg_heat_score / len(results)
        HeatMapDataPoint.video_length = results[-1].end_time

        return find_peaks(results)
    except:
        return False

def find_peaks(results):
    peaks = []
    results.sort()
    i = binarySearch(results, HeatMapDataPoint.total_avg_heat_score)
    peaks = results[i:]
    
    return get_clip_times(peaks)

def binarySearch(data, val):
    lo, hi = 0, len(data) - 1
    best_ind = lo
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if data[mid].avg_heat_score < val:
            lo = mid + 1
        elif data[mid].avg_heat_score > val:
            hi = mid - 1
        else:
            best_ind = mid
            break
        #Check if data[mid] is closer to val than data[best_ind] 
        if data[mid].avg_heat_score >= val and abs(data[mid].avg_heat_score - val) <= abs(data[best_ind].avg_heat_score - val):
            best_ind = mid
    return best_ind      

def get_clip_times(peaks):
    clip_times = []
    for peak in peaks:
        clip_times.append([intro_padding(peak), end_padding(peak)])

    clip_times.reverse()
    return clip_times

def intro_padding(peak):
    if peak.start_time - 15000 > 0:
        return peak.start_time - 15000
    else:
        return 0
    
def end_padding(peak):
    if peak.end_time + 15000 < peak.video_length:
        return peak.end_time + 15000
    else:
        return peak.video_length
    
def convert_to_milis(duration):
    duration_in_secs = 0

    hours = re.search("[0-9]+H", duration)
    minutes = re.search("[0-9]+M", duration)
    secs = re.search("[0-9]+S", duration)

    if hours != None:
        hours = hours.group()[:-1]
        duration_in_secs += int(hours) * 3600
    if minutes != None:
        minutes = minutes.group()[:-1]
        duration_in_secs += int(minutes) * 60
    if secs != None:
        secs = secs.group()[:-1]
        duration_in_secs += int(secs)

    return duration_in_secs * 1000

def find_video_duration(url):
    video_id = re.search("embed/.{11}", url).group()[6:]
    
    youtube = build('youtube', 'v3', developerKey=API_KEY)
    request = youtube.videos().list(part='contentDetails', id=video_id)
    response = request.execute()
    
    duration = response['items'][0]['contentDetails']['duration']
    seconds = convert_to_milis(duration)
    return seconds

def download_clip(url, clip_start, clip_end, clip_id):
    curr_dir = os.getcwd()
    download_prompt = "yt-dlp -f mp4 --download-sections \"*{}-{}\" -P \"{}/clips\" -o clip{}.mp4 {}".format(clip_start, clip_end, curr_dir, clip_id, url)
    os.system(download_prompt)

    clip_pattern = re.compile("clip{}.mp4".format(clip_id))
    for filepath in os.listdir("{}/clips".format(curr_dir)):
        if clip_pattern.match(filepath):
            print("Clip {} downloaded".format(clip_id))
            return True
        
    print("Clip {} not downloaded".format(clip_id))
    return download_clip(url, clip_start, clip_end, clip_id)

def download_splitscreen(url, clip_start, clip_end, clip_id):
    curr_dir = os.getcwd()
    download_prompt = "yt-dlp -f mp4 --download-sections \"*{}-{}\" -P \"{}/split\" -o split{}.mp4 {}".format(clip_start, clip_end, curr_dir, clip_id, url)
    os.system(download_prompt)
    
    clip_pattern = re.compile("split{}.mp4".format(clip_id))
    for filepath in os.listdir("{}/split".format(curr_dir)):
        if clip_pattern.match(filepath):
            print("Splitscreen {} downloaded".format(clip_id))
            return True
        
    print("Splitscreen {} not downloaded".format(clip_id))
    return download_clip(url, clip_start, clip_end, clip_id)

def download_subs(url):
    os.system("yt-dlp --write-subs --sub-lang \"en.*\" -o clip --skip-download {}".format(url))
    curr_dir = os.getcwd()

    sub_pattern = re.compile("clip\.en.*\.vtt")

    for filepath in os.listdir(curr_dir):
        if sub_pattern.match(filepath):
            return filepath
    return False

def add_auto_subs(mode, clip_name):
    sub_loc = ""

    if mode == "above":
        clip = VideoFileClip("clips/{}.mp4".format(clip_name))
        clip = crop(clip, width=1080, height=720, x_center=540)
        clip_name = clip_name + "_sub"
    else:
        clip = VideoFileClip("combined/{}_split.mp4".format(clip_name))
        sub_loc = "--sub_loc below"

    clip.write_videofile("{}.mp4".format(clip_name), temp_audiofile="temp-audio.m4a", remove_temp=True, codec="libx264", audio_codec="aac")

    os.system("auto_subtitle {st}.mp4 -o {st} {loc}".format(st=clip_name, loc=sub_loc))
    dir = os.getcwd()
    os.replace(dir + "/{st}/{st}.mp4".format(st=clip_name), dir + "/{}.mp4".format(clip_name))

    if mode == "above":
        shutil.move("{}/{}.mp4".format(dir, clip_name), "{}/subbed".format(dir))
    try:
        os.rmdir(dir + "/{}".format(clip_name))
    except:
        return "An error removing the directory occurred"
    
def add_subtitles(mode, clip_name, clip_start, clip_end, sub_file_name):
    if mode == "above":
        mp4_file_name = clip_name + ".mp4"
        video = VideoFileClip("clips/" + mp4_file_name)
        video = crop(video, width=1080, height=720, x_center=540)
        begin, end = mp4_file_name.split(".mp4")
        output_video_file = begin + "_sub.mp4"
    else:
        mp4_file_name = clip_name + "_split.mp4"
        video = VideoFileClip("combined/" + mp4_file_name)
        begin, end = mp4_file_name.split("_split.mp4")
        output_video_file = begin + ".mp4"

    subtitles = pysrt.open(sub_file_name)
    subtitle_clips = create_subtitle_clips(mode, subtitles, video.size, clip_start, clip_end)

    final_video = CompositeVideoClip([video] + subtitle_clips)
    final_video.write_videofile(output_video_file, temp_audiofile="temp-audio.m4a", remove_temp=True, codec="libx264", audio_codec="aac")

    dir = os.getcwd()
    if mode == "above":
        shutil.move("{}/{}".format(dir, output_video_file), "{}/subbed".format(dir))
    

def time_to_seconds(time_obj):
    return time_obj.hours * 3600 + time_obj.minutes * 60 + time_obj.seconds + time_obj.milliseconds / 1000

def create_subtitle_clips(mode, subtitles, videosize, clip_start, clip_end, fontsize=48, font="Helvetica-bold", color="#FFFF00", debug=False):
    pattern = r'[&<>@#$*].\S*'
    subtitle_clips = []

    for subtitle in subtitles:
        start_time = time_to_seconds(subtitle.start)
        end_time = time_to_seconds(subtitle.end)
        duration = end_time - start_time

        if (start_time >= clip_start):
            if (end_time > clip_end):
                break
            video_width, video_height = videosize

            clean_subs = re.search(pattern, subtitle.text)
            if clean_subs is not None:
                subtitle.text = subtitle.text.replace(clean_subs.group(0), "")

            text_clip = TextClip(subtitle.text.capitalize(), fontsize=fontsize, font=font, color=color, stroke_width=1.5, stroke_color=color, bg_color="None", size=(video_width * 3/4, None), method="caption").set_start(start_time - clip_start).set_duration(duration)
            subtitle_x_pos = "center"
            if mode == "above":
                subtitle_y_pos = video_height * 4/5
            else:
                subtitle_y_pos = 1000

            text_pos = (subtitle_x_pos, subtitle_y_pos)
            subtitle_clips.append(text_clip.set_position(text_pos))

    return subtitle_clips

def add_splitscreen(mode, clip_name, gameplay_name):
    if mode == "above":
        clip1 = VideoFileClip("subbed/{}_sub.mp4".format(clip_name))
    else:
        clip1 = VideoFileClip("clips/{}.mp4".format(clip_name))
        clip1 = crop(clip1, width=1080, height=720, x_center=540)
        if mode == "below":
            clip_name = clip_name + "_split"

    clip2 = VideoFileClip("split/{}.mp4".format(gameplay_name)).without_audio()
    cropClip2 = crop(clip2, width=1080, height=720, x_center=540, y_center=360)

    clip1 = clip1.resize((1080, 740))
    cropClip2 = cropClip2.resize((1080, 740))

    if clip2.duration > clip1.duration:
        cropClip2 = cropClip2.subclip(0, clip1.duration)

    image = ImageClip("transparent.png").set_duration(clip1.duration)
    image = image.resize((1080, 220))

    combined = clips_array([[image], [clip1], [cropClip2], [image]])
    combined.write_videofile("{}.mp4".format(clip_name), temp_audiofile="temp-audio.m4a", remove_temp=True, codec="libx264", audio_codec="aac")

    dir = os.getcwd()
    if mode == "below":
        shutil.move("{}/{}.mp4".format(dir, clip_name), "{}/combined".format(dir))


if __name__ == '__main__':
    app.run(debug=True)
    

//purpose is to start up the camera feature and show the feed from the camera into the page.

interface CameraFeedPropsInterface {
  sendFile: any
}

interface CameraFeedStateInteraface {

    availableCameraDevices: CameraDeviceInputInfoInterface[]
    selectCamerasDeviceById: string
}

//CameraDeviceInputInfoInterface that describe the given object of a device we get from the browser API.

interface CameraDeviceInputInfoInterface {
    deviceId: string;
    groupId: string;
    kind: string;
    label: string;
}

export class CameraFeed extends Component<CameraFeedPropsInterface,CameraFeedStateInteraface> {
videoPlayer: any;

//componentDidMount will help us to wait for the DOM to be ready so we can interact with the navigator and mediaDevices api.

async componentDidMount() {
    this.initializeCamera();
}

initializeCamera() {
    this.setDevice();
}
//main method to access the browser web api.
async setDevice() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    this.videoPlayer.srcObject = stream;

    setTimeout(() => {
        this.videoPlayer.play();
    }, 500)
}

render() {
    return (
    <div className={styles.camera_container}>
        <div>
            <video ref={ref => (this.videoPlayer = ref)} width="680" height="360" />
        </div>
    </div>
    <button onClick={this.capturePhoto} className={styles.capture_photo}>Capture photo</button>
            <div className={styles.stage}>
                <canvas width="680" height="360" ref={ref => (this.canvas = ref)} />
            </div>

    );
}
}

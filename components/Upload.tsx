import {useState, useEffect, useRef} from "react";
import {useOutletContext} from "react-router";
import {CheckCircle2, ImageIcon, UploadIcon} from "lucide-react";
import {
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_MB,
    PROGRESS_INTERVAL_MS,
    PROGRESS_STEP,
    REDIRECT_DELAY_MS
} from "../lib/constants";

interface UploadProps {
    onComplete?: (data: string | { error: string }) => void;
}

const Upload = ({onComplete}: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);

    const uploadIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const {isSignedIn} = useOutletContext<AuthContext>();

    useEffect(() => {
        return () => {
            if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
            if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
        };
    }, []);

    const processFile = (file: File) => {
        if (!isSignedIn) return;

        // Validation: Check file type and size
        const isAllowedType = ALLOWED_MIME_TYPES.includes(file.type);
        const isWithinSizeLimit = file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;

        if (!isAllowedType || !isWithinSizeLimit) {
            const errorMessage = !isAllowedType 
                ? "Invalid file type. Please upload a JPG or PNG image." 
                : `File size exceeds the ${MAX_FILE_SIZE_MB}MB limit.`;
            
            onComplete?.({ error: errorMessage });
            return;
        }

        // Reset and clear any existing flows
        setProgress(0);
        if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
        if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);

        setFile(file);
        const reader = new FileReader();

        reader.onload = (e) => {
            const base64Data = e.target?.result as string;

            uploadIntervalRef.current = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        if (uploadIntervalRef.current) {
                            clearInterval(uploadIntervalRef.current);
                            uploadIntervalRef.current = null;
                        }

                        redirectTimeoutRef.current = setTimeout(() => {
                            onComplete?.(base64Data);
                            redirectTimeoutRef.current = null;
                        }, REDIRECT_DELAY_MS);
                        return 100;
                    }
                    return prev + PROGRESS_STEP;
                });
            }, PROGRESS_INTERVAL_MS);
        };

        reader.readAsDataURL(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (isSignedIn) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (!isSignedIn) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;

        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    return (
        <div className="upload">
            {!file ? (
                <div 
                    className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="drop-input"
                        accept=".jpg, .jpeg, .png"
                        disabled={!isSignedIn}
                        onChange={handleChange}
                    />

                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={20} />
                        </div>
                        <p>
                            {isSignedIn ? (
                                "Click to upload or just drag and drop your floor plan here"
                            ) :(
                                "Sign in or create an account to upload your floor plan"
                            )}
                        </p>
                        <p className="help">Maximum  file size 10MB.</p>
                    </div>
                </div>
            ):(
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress === 100 ? (
                                <CheckCircle2 className="check" />
                            ) : (
                                <ImageIcon className="image "/>
                            )}
                        </div>

                        <h3>{file.name}</h3>

                        <div className="progress">
                            <div className="bar" style={{width: `${progress}%`}}/>

                            <p className="status-text">
                                {progress < 100 ? 'Analyzing Floor Plan...' : 'Redirecting...'}
                            </p>
                        </div>
                    </div>
                </div>)}
        </div>
    )
}
export default Upload

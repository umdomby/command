"use client";
import { uploadFile } from "../../../gamerecord_online/app/actions";

export default function UploadForm() {
    return (
        <form action={uploadFile} className="flex flex-col gap-4">
            <label>
                <span>Upload a file</span>
                <input type="file" name="file"  />
            </label>
            <button type="submit">Submit</button>
        </form>
    );
}


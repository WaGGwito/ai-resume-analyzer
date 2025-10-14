import React from 'react';
import { useParams } from 'react-router';


const Resume = () => {

const {id} = useParams();

  return(

   <div>
     Resume.id: {id}

   </div>
  )

}

export default Resume;